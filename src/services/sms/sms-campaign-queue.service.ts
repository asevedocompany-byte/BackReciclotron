import { getConfig } from "@reciclotron/config";
import type {
  SmsCampaignDispatchContext,
  SmsCampaignDispatchJob,
  SmsCampaignJobPayload,
  SmsQueueState,
  SmsQueueStatus
} from "./sms.types.js";

type SmsCampaignDispatchProcessor = (job: SmsCampaignDispatchJob, context: SmsCampaignDispatchContext) => Promise<void>;
type SmsCampaignDispatchListener = (state: SmsQueueState) => void;

function nowIso() {
  return new Date().toISOString();
}

function addMinutes(isoDate: string, minutes: number) {
  return new Date(Date.parse(isoDate) + minutes * 60_000).toISOString();
}

function createInitialState(job: SmsCampaignDispatchJob): SmsQueueState {
  const startedAt = nowIso();
  return {
    jobId: job.jobId,
    campaignId: job.campaignId,
    status: "queued",
    total: job.totalRecipients,
    processed: 0,
    sent: 0,
    failed: 0,
    percent: 0,
    startedAt: null,
    updatedAt: startedAt,
    finishedAt: null,
    lastEmittedPercent: 0,
    expiresAt: null,
    clients: 0,
    errorReason: null
  };
}

type JobRecord = {
  job: SmsCampaignDispatchJob;
  state: SmsQueueState;
};

export class SmsCampaignQueueService {
  // Registry em memória local: job e stream SSE precisam rodar na mesma instância.
  private readonly jobs = new Map<string, JobRecord>();
  private readonly campaignIndex = new Map<string, string>();
  private readonly listeners = new Map<string, Set<SmsCampaignDispatchListener>>();
  private readonly active = new Set<string>();
  private readonly maxConcurrentCampaigns = 2;
  private readonly terminalStateRetentionMs = 3 * 60 * 1000;
  private readonly cleanupTimer = setInterval(() => {
    this.cleanupExpiredJobs();
  }, 60_000);
  private processor?: SmsCampaignDispatchProcessor;
  private draining = false;

  constructor() {
    this.cleanupTimer.unref?.();
  }

  setProcessor(processor: SmsCampaignDispatchProcessor) {
    this.processor = processor;
  }

  dispose() {
    clearInterval(this.cleanupTimer);
    this.jobs.clear();
    this.campaignIndex.clear();
    this.listeners.clear();
    this.active.clear();
    console.info("[SmsCampaignQueue] disposed");
  }

  enqueue(job: SmsCampaignJobPayload) {
    const jobId = `smsjob_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fullJob: SmsCampaignDispatchJob = {
      ...job,
      jobId,
      batchSize: job.batchSize ?? 10
    };
    const state = createInitialState(fullJob);

    this.jobs.set(jobId, { job: fullJob, state });
    this.campaignIndex.set(fullJob.campaignId, jobId);
    this.emit(jobId, state);

    console.info("[SmsCampaignQueue] job enqueued", {
      jobId,
      campaignId: fullJob.campaignId,
      total: fullJob.totalRecipients,
      batchSize: fullJob.batchSize,
      queueSize: this.jobs.size
    });

    void this.drain();
    return state;
  }

  getStatus(id: string) {
    const jobId = this.resolveJobId(id);
    if (!jobId) return null;
    return this.jobs.get(jobId)?.state ?? null;
  }

  getStatusByCampaignId(campaignId: string) {
    return this.getStatus(campaignId);
  }

  subscribe(id: string, listener: SmsCampaignDispatchListener) {
    const jobId = this.resolveJobId(id);
    if (!jobId) return () => undefined;

    const listeners = this.listeners.get(jobId) ?? new Set<SmsCampaignDispatchListener>();
    listeners.add(listener);
    this.listeners.set(jobId, listeners);

    const record = this.jobs.get(jobId);
    if (record) {
      record.state = {
        ...record.state,
        clients: listeners.size
      };
      queueMicrotask(() => {
        listener(record.state);
      });
    }

    return () => {
      const currentListeners = this.listeners.get(jobId);
      if (!currentListeners) return;
      currentListeners.delete(listener);
      const currentRecord = this.jobs.get(jobId);
      if (currentRecord) {
        currentRecord.state = {
          ...currentRecord.state,
          clients: currentListeners.size
        };
      }
      if (currentListeners.size === 0) {
        this.listeners.delete(jobId);
      }
    };
  }

  publishProgress(
    jobId: string,
    patch: Partial<SmsQueueState>,
    options?: { force?: boolean; emitIfPercentAdvancedBy?: number }
  ) {
    const record = this.jobs.get(jobId);
    if (!record) return null;

    const previous = record.state;
    const nextPercent = patch.percent ?? previous.percent;
    const nextStatus = patch.status ?? previous.status;
    const next: SmsQueueState = {
      ...previous,
      ...patch,
      percent: nextPercent,
      status: nextStatus,
      updatedAt: nowIso(),
      clients: this.listeners.get(jobId)?.size ?? previous.clients
    };

    if (!next.startedAt && nextStatus === "running") {
      next.startedAt = nowIso();
    }

    if (nextStatus === "completed" || nextStatus === "failed" || nextStatus === "cancelled") {
      next.finishedAt = next.finishedAt ?? nowIso();
      next.expiresAt = next.expiresAt ?? addMinutes(next.finishedAt, 3);
    }

    const percentStep = options?.emitIfPercentAdvancedBy ?? 1;
    const shouldEmit = Boolean(
      options?.force
      || next.status !== previous.status
      || next.percent >= previous.lastEmittedPercent + percentStep
      || next.status === "completed"
      || next.status === "failed"
      || next.status === "cancelled"
    );

    if (shouldEmit) {
      next.lastEmittedPercent = next.percent;
    }

    record.state = next;

    if (shouldEmit) {
      this.emit(jobId, next);
    }

    return next;
  }

  complete(jobId: string) {
    const state = this.getStatus(jobId);
    if (!state) return null;
    return this.publishProgress(jobId, {
      status: "completed",
      percent: 100,
      processed: state.total,
      sent: state.sent,
      failed: state.failed
    }, { force: true });
  }

  fail(jobId: string, errorReason: string, status: SmsQueueStatus = "failed") {
    return this.publishProgress(jobId, {
      status,
      errorReason,
      finishedAt: nowIso(),
      expiresAt: addMinutes(nowIso(), 3)
    }, { force: true });
  }

  private emit(jobId: string, state: SmsQueueState) {
    const listeners = this.listeners.get(jobId);
    if (!listeners || listeners.size === 0) return;

    for (const listener of listeners) {
      try {
        listener(state);
      } catch (error) {
        console.error("[SmsCampaignQueue] listener failed", {
          jobId,
          error: error instanceof Error ? { name: error.name, message: error.message } : String(error)
        });
      }
    }
  }

  private resolveJobId(id: string) {
    if (this.jobs.has(id)) return id;
    return this.campaignIndex.get(id) ?? null;
  }

  private async drain() {
    if (this.draining || !this.processor) return;
    this.draining = true;

    try {
      while (this.active.size < this.maxConcurrentCampaigns) {
        const nextEntry = Array.from(this.jobs.entries()).find(([jobId, record]) => record.state.status === "queued" && !this.active.has(jobId));
        if (!nextEntry) break;

        const [jobId, record] = nextEntry;
        this.active.add(jobId);
        void this.run(record.job);
      }
    } finally {
      this.draining = false;
    }
  }

  private async run(job: SmsCampaignDispatchJob) {
    const runId = `${job.jobId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const abortController = new AbortController();
    const config = getConfig();
    const jobTimeoutMs = Math.max(
      job.totalRecipients * config.SMS_DISPATCH_INTERVAL_MS + 5 * 60 * 1000,
      10 * 60 * 1000
    );
    const timeoutTimer = setTimeout(() => {
      if (!abortController.signal.aborted) {
        console.error("[SmsCampaignQueue] job timeout reached", {
          jobId: job.jobId,
          campaignId: job.campaignId,
          runId,
          timeoutMs: jobTimeoutMs
        });
        abortController.abort(new Error(`Sms campaign job timed out after ${jobTimeoutMs}ms`));
      }
    }, jobTimeoutMs);

    this.publishProgress(job.jobId, {
      status: "running",
      startedAt: nowIso(),
      percent: 0
    }, { force: true });

    console.info("[SmsCampaignQueue] job started", {
      jobId: job.jobId,
      campaignId: job.campaignId,
      runId,
      totalRecipients: job.totalRecipients,
      batchSize: job.batchSize
    });

    try {
      if (!this.processor) {
        throw new Error("SmsCampaignQueue processor nao configurado.");
      }

      await this.processor(job, {
        signal: abortController.signal,
        timeoutMs: jobTimeoutMs,
        runId,
        jobId: job.jobId
      });

      this.complete(job.jobId);
      console.info("[SmsCampaignQueue] job completed", {
        jobId: job.jobId,
        campaignId: job.campaignId,
        runId
      });
    } catch (error) {
      const errorReason = error instanceof Error ? error.message : String(error);
      const current = this.getStatus(job.jobId);
      this.fail(job.jobId, errorReason);
      if (current) {
        this.publishProgress(job.jobId, {
          processed: current.processed,
          sent: current.sent,
          failed: current.failed,
          percent: current.percent
        }, { force: true });
      }
      console.error("[SmsCampaignQueue] job failed", {
        jobId: job.jobId,
        campaignId: job.campaignId,
        runId,
        error: error instanceof Error ? { name: error.name, message: error.message } : String(error)
      });
    } finally {
      clearTimeout(timeoutTimer);
      this.active.delete(job.jobId);
      void this.drain();
    }
  }

  private cleanupExpiredJobs() {
    const now = Date.now();
    for (const [jobId, record] of this.jobs.entries()) {
      const expiresAt = record.state.expiresAt ? Date.parse(record.state.expiresAt) : null;
      const isExpired = expiresAt !== null && Number.isFinite(expiresAt) && expiresAt <= now;
      if (!isExpired) continue;

      this.listeners.delete(jobId);
      this.active.delete(jobId);
      this.jobs.delete(jobId);
      if (this.campaignIndex.get(record.job.campaignId) === jobId) {
        this.campaignIndex.delete(record.job.campaignId);
      }

      console.info("[SmsCampaignQueue] job cleaned up", {
        jobId,
        campaignId: record.job.campaignId,
        retentionMs: this.terminalStateRetentionMs
      });
    }
  }
}
