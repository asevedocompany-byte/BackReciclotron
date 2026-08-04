export type SmsRecipient = {
  legacyId: number;
  phoneRaw: string | null;
  phoneE164: string | null;
  email?: string | null;
  recipientName: string | null;
  isValid: boolean;
  normalizationError: string | null;
};

export type SmsCampaignDispatchJob = {
  jobId: string;
  campaignId: string;
  message: string;
  recipients: SmsRecipient[];
  totalRecipients: number;
  batchSize: number;
};

export type SmsCampaignDispatchContext = {
  signal: AbortSignal;
  timeoutMs: number;
  runId: string;
  jobId: string;
};

export type SmsDispatchResult = {
  providerMessageId: string;
  accepted: number;
  rejected: number;
};

export type SmsQueueStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type SmsQueueState = {
  jobId: string;
  campaignId: string;
  status: SmsQueueStatus;
  total: number;
  processed: number;
  sent: number;
  failed: number;
  percent: number;
  startedAt: string | null;
  updatedAt: string;
  finishedAt: string | null;
  lastEmittedPercent: number;
  expiresAt: string | null;
  clients: number;
  errorReason: string | null;
};

export type SmsCampaignJobPayload = Omit<SmsCampaignDispatchJob, "jobId">;
