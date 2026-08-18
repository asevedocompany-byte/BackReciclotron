import { AppError } from "../../shared/errors/app-error.js";

export type CampaignDispatchStatus = "queued" | "running" | "completed" | "failed";

export type CampaignDispatchState = {
  campaignId: string;
  status: CampaignDispatchStatus;
  progress: number;
  totalRecipients: number;
  processedRecipients: number;
  acceptedRecipients: number;
  rejectedRecipients: number;
  queuedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  errorReason: string | null;
};

export type CampaignDispatchJob = {
  campaignId: string;
  recipientIds: (string | number)[];
  totalRecipients: number;
};

export type CampaignDispatchContext = {
  signal: AbortSignal;
  timeoutMs: number;
  runId: string;
};

type CampaignDispatchProcessor = (job: CampaignDispatchJob, context: CampaignDispatchContext) => Promise<void>;
type CampaignDispatchListener = (state: CampaignDispatchState) => void;

function createInitialState(job: CampaignDispatchJob): CampaignDispatchState {
  return {
    campaignId: job.campaignId,
    status: "queued",
    progress: 0,
    totalRecipients: job.totalRecipients,
    processedRecipients: 0,
    acceptedRecipients: 0,
    rejectedRecipients: 0,
    queuedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    errorReason: null
  };
}

export class CampaignEmailQueueService {
  private readonly jobs = new Map<string, CampaignDispatchJob>();
  private readonly states = new Map<string, CampaignDispatchState>();
  private readonly listeners = new Map<string, Set<CampaignDispatchListener>>();
  private readonly active = new Set<string>();
  private readonly cleanupTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly maxConcurrentCampaigns = 2;
  private readonly jobTimeoutMs = 10 * 60 * 1000;
  private readonly terminalStateRetentionMs = 30 * 60 * 1000;
  private processor?: CampaignDispatchProcessor;
  private draining = false;

  setProcessor(processor: CampaignDispatchProcessor) {
    this.processor = processor;
  }

  dispose() {
    for (const timer of this.cleanupTimers.values()) {
      clearTimeout(timer);
    }
    this.cleanupTimers.clear();
    this.jobs.clear();
    this.states.clear();
    this.listeners.clear();
    this.active.clear();
    console.info("[SES][CampaignEmailQueue] disposed");
  }

  subscribe(campaignId: string, listener: CampaignDispatchListener) {
    const listeners = this.listeners.get(campaignId) ?? new Set<CampaignDispatchListener>();
    listeners.add(listener);
    this.listeners.set(campaignId, listeners);

    const current = this.states.get(campaignId);
    if (current) {
      queueMicrotask(() => {
        listener(current);
      });
    }

    return () => {
      const currentListeners = this.listeners.get(campaignId);
      if (!currentListeners) return;
      currentListeners.delete(listener);
      if (currentListeners.size === 0) {
        this.listeners.delete(campaignId);
      }
    };
  }

  enqueue(job: CampaignDispatchJob) {
    const existing = this.states.get(job.campaignId);
    if (existing && (existing.status === "queued" || existing.status === "running")) {
    console.info("[SES][CampaignEmailQueue] enqueue skipped (already active)", {
        campaignId: job.campaignId,
        status: existing.status
      });
      return existing;
    }

    const state = createInitialState(job);
    const previousTimer = this.cleanupTimers.get(job.campaignId);
    if (previousTimer) {
      clearTimeout(previousTimer);
      this.cleanupTimers.delete(job.campaignId);
    }
    this.jobs.set(job.campaignId, job);
    this.states.set(job.campaignId, state);
    this.emit(job.campaignId, state);
    console.info("[SES][CampaignEmailQueue] job enqueued", {
      campaignId: job.campaignId,
      totalRecipients: job.totalRecipients,
      queueSize: this.jobs.size
    });
    void this.drain();
    return state;
  }

  getStatus(campaignId: string) {
    return this.states.get(campaignId) ?? null;
  }

  updateStatus(campaignId: string, patch: Partial<CampaignDispatchState>) {
    const current = this.states.get(campaignId);
    if (!current) return null;
    const next = { ...current, ...patch };
    this.states.set(campaignId, next);
    this.emit(campaignId, next);
    return next;
  }

  private emit(campaignId: string, state: CampaignDispatchState) {
    const listeners = this.listeners.get(campaignId);
    if (!listeners || listeners.size === 0) return;

    for (const listener of listeners) {
      try {
        listener(state);
      } catch (error) {
        console.error("[SES][CampaignEmailQueue] listener failed", {
          campaignId,
          error: error instanceof Error ? { name: error.name, message: error.message } : String(error)
        });
      }
    }
  }

  private async drain() {
    if (this.draining || !this.processor) return;
    this.draining = true;

    try {
      while (this.active.size < this.maxConcurrentCampaigns) {
        const nextEntry = Array.from(this.jobs.entries()).find(([campaignId]) => !this.active.has(campaignId));
        if (!nextEntry) break;

        const [campaignId, job] = nextEntry;
        this.jobs.delete(campaignId);
        this.active.add(campaignId);
        void this.run(job);
      }
    } finally {
      this.draining = false;
    }
  }

  private async run(job: CampaignDispatchJob) {
    const runId = `${job.campaignId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const abortController = new AbortController();
    const timeoutTimer = setTimeout(() => {
      if (!abortController.signal.aborted) {
        console.error("[SES][CampaignEmailQueue] job timeout reached", {
          campaignId: job.campaignId,
          runId,
          timeoutMs: this.jobTimeoutMs
        });
        abortController.abort(new Error(`Campaign job timed out after ${this.jobTimeoutMs}ms`));
      }
    }, this.jobTimeoutMs);

    this.updateStatus(job.campaignId, {
      status: "running",
      startedAt: new Date().toISOString(),
      progress: 5
    });

    try {
      if (!this.processor) {
        throw new Error("CampaignEmailQueue processor nao configurado.");
      }

      await this.processor(job, {
        signal: abortController.signal,
        timeoutMs: this.jobTimeoutMs,
        runId
      });

      this.updateStatus(job.campaignId, {
        status: "completed",
        progress: 100,
        completedAt: new Date().toISOString(),
        errorReason: null
      });
      console.info("[SES][CampaignEmailQueue] job completed", {
        campaignId: job.campaignId,
        runId
      });
    } catch (error) {
      const errorReason = error instanceof Error ? error.message : String(error);
      if (error instanceof AppError && error.details && typeof error.details === "object") {
        const details = error.details as {
          accepted?: number;
          rejected?: number;
        };
        const acceptedRecipients = typeof details.accepted === "number" ? details.accepted : undefined;
        const rejectedRecipients = typeof details.rejected === "number" ? details.rejected : undefined;
        if (acceptedRecipients !== undefined || rejectedRecipients !== undefined) {
          this.updateStatus(job.campaignId, {
            acceptedRecipients: acceptedRecipients ?? 0,
            rejectedRecipients: rejectedRecipients ?? 0,
            processedRecipients: (acceptedRecipients ?? 0) + (rejectedRecipients ?? 0)
          });
        }
      }
      this.updateStatus(job.campaignId, {
        status: "failed",
        completedAt: new Date().toISOString(),
        errorReason,
        progress: 100
      });
      console.error("[SES][CampaignEmailQueue] job failed", {
        campaignId: job.campaignId,
        runId,
        error: error instanceof Error ? { name: error.name, message: error.message } : String(error)
      });
    } finally {
      clearTimeout(timeoutTimer);
      this.active.delete(job.campaignId);
      const cleanupTimer = setTimeout(() => {
        this.states.delete(job.campaignId);
        this.cleanupTimers.delete(job.campaignId);
        console.info("[SES][CampaignEmailQueue] terminal state cleaned", {
          campaignId: job.campaignId,
          retentionMs: this.terminalStateRetentionMs
        });
      }, this.terminalStateRetentionMs);
      this.cleanupTimers.set(job.campaignId, cleanupTimer);
      void this.drain();
    }
  }
}
