import { BillingClient, GetCreditsCommand, type CreditData } from "@aws-sdk/client-billing";
import {
  CostExplorerClient,
  GetCostAndUsageCommand,
} from "@aws-sdk/client-cost-explorer";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { GetSMSAttributesCommand, SNSClient } from "@aws-sdk/client-sns";
import { CloudWatchClient, GetMetricDataCommand } from "@aws-sdk/client-cloudwatch";
import { GetSendStatisticsCommand, SESClient } from "@aws-sdk/client-ses";
import { getConfig } from "@reciclotron/config";

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function sumCreditAmount(credits: CreditData[] | undefined) {
  return Number(
    (credits ?? [])
      .reduce((sum, credit) => {
        return (
          sum +
          Number(
            credit.remainingAmount?.currencyAmount ??
              credit.estimatedAmount?.currencyAmount ??
              0
          )
        );
      }, 0)
      .toFixed(2)
  );
}

function startOfMonthUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function nextMonthStartUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}

function previousMonthStartUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1));
}

function toNumber(value: string | number | null | undefined) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function round2(value: number) {
  return Number(value.toFixed(2));
}

type CostExplorerManualSnapshot = {
  source: "manual_conciliation";
  available: boolean;
  amountUsd: number | null;
  estimated: boolean | null;
  periodStart: string;
  periodEnd: string;
  error: string | null;
};

type CostExplorerServiceBreakdownSnapshot = {
  source: "cost_explorer";
  available: boolean;
  periodStart: string;
  periodEnd: string;
  totalUnblendedCostUsd: number | null;
  services: Array<{
    name: string;
    unblendedCostUsd: number;
    usageQuantity: number;
    estimated: boolean;
  }>;
  error: string | null;
};

type SmsAttributesSnapshot = {
  available: boolean;
  monthlySpendLimitUsd: number | null;
  error: string | null;
};

const costExplorerSnapshotCache = new Map<string, {
  expiresAt: number;
  value: CostExplorerManualSnapshot | CostExplorerServiceBreakdownSnapshot;
}>();
const costExplorerSnapshotInFlight = new Map<string, Promise<CostExplorerManualSnapshot | CostExplorerServiceBreakdownSnapshot>>();

function getCostExplorerCacheKey(params: {
  start: Date;
  end: Date;
  services?: string[];
}) {
  return [
    formatDate(params.start),
    formatDate(params.end),
    [...(params.services ?? [])].sort().join(","),
  ].join("|");
}

function getCostExplorerServiceBreakdownCacheKey(params: {
  start: Date;
  end: Date;
}) {
  return [
    "service-breakdown",
    formatDate(params.start),
    formatDate(params.end),
  ].join("|");
}

async function getCachedCostExplorerSnapshot<T extends CostExplorerManualSnapshot | CostExplorerServiceBreakdownSnapshot>(
  cacheKey: string,
  cacheTtlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  if (cacheTtlMs <= 0) {
    return fetcher();
  }

  const nowMs = Date.now();
  const cached = costExplorerSnapshotCache.get(cacheKey);

  if (cached && cached.expiresAt > nowMs) {
    return cached.value as T;
  }

  const inFlight = costExplorerSnapshotInFlight.get(cacheKey);
  if (inFlight) {
    return inFlight as Promise<T>;
  }

  const request = fetcher().then((value) => {
    costExplorerSnapshotCache.set(cacheKey, {
      expiresAt: Date.now() + cacheTtlMs,
      value,
    });
    return value;
  }).finally(() => {
    costExplorerSnapshotInFlight.delete(cacheKey);
  });

  costExplorerSnapshotInFlight.set(cacheKey, request);
  return request;
}

/**
 * FONTE OFICIAL AMAZON:
 * - CloudWatch metric: AWS/SNS -> SMSVoice -> TextMessageMonthlySpend
 * - SNS MonthlySpendLimit via GetSMSAttributes
 */
async function getSmsOfficialSpendSnapshot(params: {
  sns: SNSClient;
  cloudWatch: CloudWatchClient;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const start = startOfMonthUtc(now);
  const end = nextMonthStartUtc(now);

  const [limitResult, metricResult] = await Promise.allSettled([
      params.sns.send(
        new GetSMSAttributesCommand({
          attributes: ["MonthlySpendLimit"],
        })
      ),
      params.cloudWatch.send(
        new GetMetricDataCommand({
          StartTime: start,
          EndTime: now,
          ScanBy: "TimestampDescending",
          MetricDataQueries: [
            {
              Id: "sms_spend",
              ReturnData: true,
              MetricStat: {
                Metric: {
                  Namespace: "AWS/SNS",
                  MetricName: "SMSMonthToDateSpentUSD",
                },
                Period: 86400,
                Stat: "Maximum",
              },
            },
          ],
        })
      ),
    ]);

  const limitResp = limitResult.status === "fulfilled" ? limitResult.value : null;
  const metricResp = metricResult.status === "fulfilled" ? metricResult.value : null;

  const errors = [
    limitResult.status === "rejected" ? `SNS: ${getErrorMessage(limitResult.reason)}` : null,
    metricResult.status === "rejected" ? `CloudWatch: ${getErrorMessage(metricResult.reason)}` : null,
  ].filter(Boolean).join(" | ");
  if (errors) console.error("[AWS Billing][SMS] falha parcial nas fontes oficiais", errors);

  const monthlySpendLimitUsd = limitResp ? toNumber(limitResp.attributes?.MonthlySpendLimit) : null;
  const spendResult = metricResp?.MetricDataResults?.[0];
  const spendValues = spendResult?.Values ?? [];
  const spendTimestamps = spendResult?.Timestamps ?? [];
  let latestSpendValue: number | null = null;

  // CloudWatch retorna pontos ao longo do mês.
  // O valor correto para o painel é o valor do datapoint mais recente.
  if (spendValues.length && spendTimestamps.length === spendValues.length) {
    const latestIndex = spendTimestamps
      .map((timestamp, index) => ({ timestampMs: timestamp.getTime(), index }))
      .sort((a, b) => b.timestampMs - a.timestampMs)[0].index;

    latestSpendValue = toNumber(spendValues[latestIndex]);
  } else if (spendValues.length) {
    latestSpendValue = toNumber(spendValues[spendValues.length - 1]);
  }

  const monthlySpendUsd = latestSpendValue === null ? null : round2(latestSpendValue);

  return {
    source: "amazon_official",
    available: limitResult.status === "fulfilled" && metricResult.status === "fulfilled",
    currency: "USD" as const,
    periodStart: formatDate(start),
    periodEnd: formatDate(end),
    monthlySpendUsd,
    monthlySpendLimitUsd,
    remainingUsd:
      monthlySpendUsd != null && monthlySpendLimitUsd != null
        ? round2(monthlySpendLimitUsd - monthlySpendUsd)
        : null,
    error: errors || null,
  };
}

/**
 * FONTE OFICIAL AMAZON:
 * - SES GetSendStatistics para volume
 * - AWS SES pricing oficial para cálculo unitário
 *   Outbound email: USD 0.16 / 1000 emails
 *   Attachments: USD 0.12 / GB
 *
 * OBS:
 * - aqui é estimativa de custo pelo volume.
 * - isso não substitui billing/fatura.
 */
async function getSesOfficialSpendSnapshot(params: {
  ses: SESClient;
  cloudWatch: CloudWatchClient;
  sentEmails: number;
  outboundDataBytes?: number;
  now?: Date;
}) {
  const SES_EMAIL_PRICE_PER_1000 = 0.16;
  const SES_OUTBOUND_DATA_PRICE_PER_GB = 0.12;
  const BYTES_PER_GB = 1024 * 1024 * 1024;

  const now = params.now ?? new Date();
  const start = startOfMonthUtc(now);
  const [statisticsResult, metricsResult] = await Promise.allSettled([
    params.ses.send(new GetSendStatisticsCommand({})),
    params.cloudWatch.send(new GetMetricDataCommand({
      StartTime: start,
      EndTime: now,
      ScanBy: "TimestampDescending",
      MetricDataQueries: ["Send", "Delivery", "Bounce", "Complaint", "Reject"].map((metricName) => ({
        Id: metricName.toLowerCase(),
        ReturnData: true,
        MetricStat: {
          Metric: {
            Namespace: "AWS/SES",
            MetricName: metricName,
          },
          Period: 86400,
          Stat: "Sum",
        },
      })),
    })),
  ]);

  const statistics = statisticsResult.status === "fulfilled" ? statisticsResult.value : null;
  const metrics = metricsResult.status === "fulfilled" ? metricsResult.value : null;
  // O painel de SMS não precisa despejar as respostas completas de SES.

  const dataPoints = statistics?.SendDataPoints ?? [];
  const statisticTotals = dataPoints.reduce((totals, point) => ({
    deliveryAttempts: totals.deliveryAttempts + (point.DeliveryAttempts ?? 0),
    bounces: totals.bounces + (point.Bounces ?? 0),
    complaints: totals.complaints + (point.Complaints ?? 0),
    rejects: totals.rejects + (point.Rejects ?? 0),
  }), { deliveryAttempts: 0, bounces: 0, complaints: 0, rejects: 0 });
  const metricTotals = Object.fromEntries(
    (metrics?.MetricDataResults ?? []).map((result) => [
      result.Id,
      result.Values?.reduce((sum, value) => sum + Number(value), 0) ?? 0,
    ])
  );

  const sentEmails = Math.max(0, metricTotals.send ?? statisticTotals.deliveryAttempts ?? params.sentEmails ?? 0);
  const outboundDataBytes = Math.max(0, params.outboundDataBytes ?? 0);

  const emailCostUsd = round2((sentEmails / 1000) * SES_EMAIL_PRICE_PER_1000);
  const outboundDataCostUsd = round2((outboundDataBytes / BYTES_PER_GB) * SES_OUTBOUND_DATA_PRICE_PER_GB);
  const totalEstimatedUsd = round2(emailCostUsd + outboundDataCostUsd);
  const errors = [
    statisticsResult.status === "rejected" ? `SES: ${getErrorMessage(statisticsResult.reason)}` : null,
    metricsResult.status === "rejected" ? `CloudWatch: ${getErrorMessage(metricsResult.reason)}` : null,
  ].filter(Boolean).join(" | ");

  return {
    source: "amazon_official",
    available: statisticsResult.status === "fulfilled",
    currency: "USD" as const,
    periodStart: formatDate(start),
    periodEnd: formatDate(now),
    sentEmails,
    outboundDataBytes,
    emailCostUsd,
    outboundDataCostUsd,
    totalEstimatedUsd,
    statistics: statisticTotals,
    metrics: {
      send: metricTotals.send ?? null,
      delivery: metricTotals.delivery ?? null,
      bounce: metricTotals.bounce ?? null,
      complaint: metricTotals.complaint ?? null,
      reject: metricTotals.reject ?? null,
      available: metricsResult.status === "fulfilled",
    },
    pricing: {
      emailUsdPer1000: SES_EMAIL_PRICE_PER_1000,
      outboundDataUsdPerGb: SES_OUTBOUND_DATA_PRICE_PER_GB,
      model: "SES à la carte; confirme o plano de preços da conta na AWS",
    },
    error: errors || null,
  };
}

/**
 * CONTA MANUAL:
 * - Cost Explorer / Billing são úteis para conciliação da fatura real
 * - não são a melhor base do painel em tempo real
 */
async function fetchCostExplorerManualSnapshot(params: {
  costExplorer: CostExplorerClient;
  start: Date;
  end: Date;
  services?: string[];
}): Promise<CostExplorerManualSnapshot> {
  try {
    const response = await params.costExplorer.send(
      new GetCostAndUsageCommand({
        TimePeriod: {
          Start: formatDate(params.start),
          End: formatDate(params.end),
        },
        Granularity: "DAILY",
        Metrics: ["UnblendedCost"],
        ...(params.services?.length
          ? {
              Filter: {
                Dimensions: {
                  Key: "SERVICE" as const,
                  Values: params.services,
                },
              },
            }
          : {}),
      })
    );
    const amount = (response.ResultsByTime ?? []).reduce((total, period) => {
      const groupedAmount = (period.Groups ?? []).reduce((periodTotal, group) => {
        return periodTotal + Number(group.Metrics?.UnblendedCost?.Amount ?? 0);
      }, 0);
      const totalAmount = Number(period.Total?.UnblendedCost?.Amount ?? 0);

      return total + groupedAmount + totalAmount;
    }, 0);

    return {
      source: "manual_conciliation",
      available: true,
      amountUsd: round2(amount),
      estimated: (response.ResultsByTime ?? []).some((period) => period.Estimated === true),
      periodStart: formatDate(params.start),
      periodEnd: formatDate(params.end),
      error: null,
    };
  } catch (error) {
    return {
      source: "manual_conciliation",
      available: false,
      amountUsd: null,
      estimated: null,
      periodStart: formatDate(params.start),
      periodEnd: formatDate(params.end),
      error: getErrorMessage(error),
    };
  }
}

async function getCostExplorerManualSnapshot(params: {
  costExplorer: CostExplorerClient;
  start: Date;
  end: Date;
  services?: string[];
  cacheTtlMs: number;
}) {
  const cacheKey = getCostExplorerCacheKey(params);
  return getCachedCostExplorerSnapshot(cacheKey, params.cacheTtlMs, () => fetchCostExplorerManualSnapshot(params));
}

async function fetchCostExplorerServiceBreakdownSnapshot(params: {
  costExplorer: CostExplorerClient;
  start: Date;
  end: Date;
}): Promise<CostExplorerServiceBreakdownSnapshot> {
  try {
    const response = await params.costExplorer.send(
      new GetCostAndUsageCommand({
        TimePeriod: {
          Start: formatDate(params.start),
          End: formatDate(params.end),
        },
        Granularity: "MONTHLY",
        Metrics: ["UnblendedCost", "UsageQuantity"],
        GroupBy: [{ Type: "DIMENSION", Key: "SERVICE" }],
      })
    );

    const servicesByName = new Map<string, {
      unblendedCostUsd: number;
      usageQuantity: number;
      estimated: boolean;
    }>();

    for (const period of response.ResultsByTime ?? []) {
      for (const group of period.Groups ?? []) {
        const name = group.Keys?.[0] ?? "Unknown";
        const current = servicesByName.get(name) ?? {
          unblendedCostUsd: 0,
          usageQuantity: 0,
          estimated: false,
        };

        servicesByName.set(name, {
          unblendedCostUsd: current.unblendedCostUsd + Number(group.Metrics?.UnblendedCost?.Amount ?? 0),
          usageQuantity: current.usageQuantity + Number(group.Metrics?.UsageQuantity?.Amount ?? 0),
          estimated: current.estimated || period.Estimated === true,
        });
      }
    }

    const services = [...servicesByName.entries()]
      .map(([name, value]) => ({
        name,
        unblendedCostUsd: round2(value.unblendedCostUsd),
        usageQuantity: round2(value.usageQuantity),
        estimated: value.estimated,
      }))
      .sort((a, b) => b.unblendedCostUsd - a.unblendedCostUsd);

    return {
      source: "cost_explorer",
      available: true,
      periodStart: formatDate(params.start),
      periodEnd: formatDate(params.end),
      totalUnblendedCostUsd: round2(services.reduce((sum, service) => sum + service.unblendedCostUsd, 0)),
      services,
      error: null,
    };
  } catch (error) {
    return {
      source: "cost_explorer",
      available: false,
      periodStart: formatDate(params.start),
      periodEnd: formatDate(params.end),
      totalUnblendedCostUsd: null,
      services: [],
      error: getErrorMessage(error),
    };
  }
}

async function getCostExplorerServiceBreakdownSnapshot(params: {
  costExplorer: CostExplorerClient;
  start: Date;
  end: Date;
  cacheTtlMs: number;
}) {
  const cacheKey = getCostExplorerServiceBreakdownCacheKey(params);
  return getCachedCostExplorerSnapshot(
    cacheKey,
    params.cacheTtlMs,
    () => fetchCostExplorerServiceBreakdownSnapshot(params)
  );
}

function buildManualSnapshotFromServiceBreakdown(params: {
  breakdown: CostExplorerServiceBreakdownSnapshot;
  start: Date;
  end: Date;
  serviceMatchers: RegExp[];
}) {
  const matchingServices = params.breakdown.services.filter((service) => {
    return params.serviceMatchers.some((matcher) => matcher.test(service.name));
  });
  const amountUsd = matchingServices.reduce((sum, service) => sum + service.unblendedCostUsd, 0);

  return {
    source: "manual_conciliation",
    available: params.breakdown.available,
    amountUsd: params.breakdown.available ? round2(amountUsd) : null,
    estimated: params.breakdown.available ? matchingServices.some((service) => service.estimated) : null,
    periodStart: formatDate(params.start),
    periodEnd: formatDate(params.end),
    error: params.breakdown.error,
  } satisfies CostExplorerManualSnapshot;
}

function logAwsProofSnapshot(params: {
  region: string;
  costExplorerCacheTtlMs: number;
  serviceBreakdown: CostExplorerServiceBreakdownSnapshot;
  previousClosedMonthBreakdown: CostExplorerServiceBreakdownSnapshot;
  smsCost: CostExplorerManualSnapshot;
  previousClosedMonthSmsCost: CostExplorerManualSnapshot;
  credits: Awaited<ReturnType<typeof getCreditsSnapshot>>;
  officialSms: Awaited<ReturnType<typeof getSmsOfficialSpendSnapshot>>;
  smsAttributes: SmsAttributesSnapshot;
}) {
  const highlightedServices = params.serviceBreakdown.services.filter((service) => {
    return /sms|messaging|notification|sns|ses|cost explorer/i.test(service.name) || service.unblendedCostUsd > 0;
  });
  const previousClosedMonthHighlightedServices = params.previousClosedMonthBreakdown.services.filter((service) => {
    return /sms|messaging|notification|sns|ses|cost explorer/i.test(service.name) || service.unblendedCostUsd > 0;
  });

  console.info("[AWS Proof][Billing] resumo carregado", {
    region: params.region,
    costExplorerCacheTtlMs: params.costExplorerCacheTtlMs,
    costExplorerCurrentMonth: {
      periodStart: params.serviceBreakdown.periodStart,
      periodEnd: params.serviceBreakdown.periodEnd,
      available: params.serviceBreakdown.available,
      totalUnblendedCostUsd: params.serviceBreakdown.totalUnblendedCostUsd,
      smsCostExplorerUsd: params.smsCost.amountUsd,
      highlightedServices,
    },
    costExplorerPreviousClosedMonth: {
      periodStart: params.previousClosedMonthBreakdown.periodStart,
      periodEnd: params.previousClosedMonthBreakdown.periodEnd,
      available: params.previousClosedMonthBreakdown.available,
      totalUnblendedCostUsd: params.previousClosedMonthBreakdown.totalUnblendedCostUsd,
      smsCostExplorerUsd: params.previousClosedMonthSmsCost.amountUsd,
      highlightedServices: previousClosedMonthHighlightedServices,
    },
    cloudWatchSmsMonthToDateUsd: params.officialSms.monthlySpendUsd,
    smsMonthlySpendLimitUsd: params.smsAttributes.monthlySpendLimitUsd ?? params.officialSms.monthlySpendLimitUsd,
    creditsAvailable: params.credits.available,
    creditsRemainingUsd: params.credits.amountUsd,
    errors: [
      params.serviceBreakdown.error ? `CostExplorer current month: ${params.serviceBreakdown.error}` : null,
      params.previousClosedMonthBreakdown.error ? `CostExplorer previous month: ${params.previousClosedMonthBreakdown.error}` : null,
      params.credits.error ? `Credits: ${params.credits.error}` : null,
      params.officialSms.error ? `CloudWatch/SNS: ${params.officialSms.error}` : null,
      params.smsAttributes.error ? `SNS attributes: ${params.smsAttributes.error}` : null,
    ].filter(Boolean),
  });
}

async function getCreditsSnapshot(params: {
  billing: BillingClient;
  sts: STSClient;
  accountId?: string;
  now?: Date;
}) {
  const now = params.now ?? new Date();

  try {
    let accountId = params.accountId;

    if (!accountId) {
      const identity = await params.sts.send(new GetCallerIdentityCommand({}));
      accountId = identity.Account;
    }

    if (!accountId) {
      throw new Error("Não foi possível identificar a conta AWS.");
    }

    const startDate = new Date(now);
    startDate.setUTCDate(startDate.getUTCDate() - 364);

    const response = await params.billing.send(
      new GetCreditsCommand({
        accountId,
        startDate,
        endDate: now,
      })
    );
    const activeCredits = (response.credits ?? []).filter((credit) => credit.creditStatus !== "DISABLED");

    return {
      source: "amazon_official",
      available: true,
      amountUsd: sumCreditAmount(activeCredits),
      credits: activeCredits.map((credit) => ({
        id: credit.creditId,
        description: credit.description,
        remainingUsd: Number(
          credit.remainingAmount?.currencyAmount ??
            credit.estimatedAmount?.currencyAmount ??
            0
        ),
        expiresAt: credit.endDate?.toISOString() ?? null,
        products: credit.applicableProductNames ?? [],
      })),
      error: null,
    };
  } catch (error) {
    return {
      source: "amazon_official",
      available: false,
      amountUsd: null,
      credits: [],
      error: getErrorMessage(error),
    };
  }
}

export class AwsBillingService {
  private readonly config = getConfig();

  private readonly credentials =
    this.config.AWS_ACCESS_KEY_ID && this.config.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: this.config.AWS_ACCESS_KEY_ID,
          secretAccessKey: this.config.AWS_SECRET_ACCESS_KEY,
          ...(this.config.AWS_SESSION_TOKEN ? { sessionToken: this.config.AWS_SESSION_TOKEN } : {}),
        }
      : undefined;

  private readonly costExplorer = new CostExplorerClient({
    region: "us-east-1",
    credentials: this.credentials,
  });

  private readonly billing = new BillingClient({
    region: "us-east-1",
    credentials: this.credentials,
  });
  private readonly snsRegion = this.config.AWS_SMS_REGION;
  private readonly costExplorerCacheTtlMs = this.config.AWS_COST_EXPLORER_CACHE_TTL_MS;

  private readonly sns = new SNSClient({
    region: this.snsRegion,
    credentials: this.credentials,
  });

  private readonly cloudWatch = new CloudWatchClient({
    region: this.snsRegion,
    credentials: this.credentials,
  });

  private readonly sesCloudWatch = new CloudWatchClient({
    region: this.config.AWS_REGION ?? "us-east-1",
    credentials: this.credentials,
  });

  private readonly sts = new STSClient({
    region: this.snsRegion,
    credentials: this.credentials,
  });

  private readonly ses = new SESClient({
    region: this.config.AWS_REGION ?? "us-east-1",
    credentials: this.credentials,
  });

  async getSmsCostSnapshot() {
    const now = new Date();
    const firstDayCurrentMonth = startOfMonthUtc(now);
    const firstDayPreviousMonth = previousMonthStartUtc(now);
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

    const [officialSpend, credits, smsAttributes, serviceBreakdown, previousClosedMonthBreakdown] = await Promise.all([
      getSmsOfficialSpendSnapshot({
        sns: this.sns,
        cloudWatch: this.cloudWatch,
        now,
      }),
      getCreditsSnapshot({
        billing: this.billing,
        sts: this.sts,
        accountId: this.config.AWS_ACCOUNT_ID,
        now,
      }),
      this.getSmsAttributes(),
      getCostExplorerServiceBreakdownSnapshot({
        costExplorer: this.costExplorer,
        start: firstDayCurrentMonth,
        end: tomorrow,
        cacheTtlMs: this.costExplorerCacheTtlMs,
      }),
      getCostExplorerServiceBreakdownSnapshot({
        costExplorer: this.costExplorer,
        start: firstDayPreviousMonth,
        end: firstDayCurrentMonth,
        cacheTtlMs: this.costExplorerCacheTtlMs,
      }),
    ]);
    const manualCost = buildManualSnapshotFromServiceBreakdown({
      breakdown: serviceBreakdown,
      start: firstDayCurrentMonth,
      end: tomorrow,
      serviceMatchers: [
        /Amazon Simple Notification Service/i,
        /AWS End User Messaging/i,
        /Amazon Pinpoint/i,
        /\bSNS\b/i,
      ],
    });
    const previousClosedMonthManualCost = buildManualSnapshotFromServiceBreakdown({
      breakdown: previousClosedMonthBreakdown,
      start: firstDayPreviousMonth,
      end: firstDayCurrentMonth,
      serviceMatchers: [
        /Amazon Simple Notification Service/i,
        /AWS End User Messaging/i,
        /Amazon Pinpoint/i,
        /\bSNS\b/i,
      ],
    });

    logAwsProofSnapshot({
      region: this.snsRegion,
      costExplorerCacheTtlMs: this.costExplorerCacheTtlMs,
      serviceBreakdown,
      previousClosedMonthBreakdown,
      smsCost: manualCost,
      previousClosedMonthSmsCost: previousClosedMonthManualCost,
      credits,
      officialSms: officialSpend,
      smsAttributes,
    });

    return {
      source: "aws",
      refreshedAt: now.toISOString(),
      official: {
        sms: officialSpend,
        credits,
        smsAttributes,
      },
      manual: {
        costExplorer: manualCost,
        serviceBreakdown,
      },
    };
  }

  async getSesCostSnapshot(params?: {
    sentEmails?: number;
    outboundDataBytes?: number;
  }) {
    const now = new Date();
    const firstDayCurrentMonth = startOfMonthUtc(now);
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));

    const [officialSpend, credits, manualCost] = await Promise.all([
      getSesOfficialSpendSnapshot({
        ses: this.ses,
        cloudWatch: this.sesCloudWatch,
        sentEmails: params?.sentEmails ?? 0,
        outboundDataBytes: params?.outboundDataBytes ?? 0,
        now,
      }),
      getCreditsSnapshot({
        billing: this.billing,
        sts: this.sts,
        accountId: this.config.AWS_ACCOUNT_ID,
        now,
      }),
      getCostExplorerManualSnapshot({
        costExplorer: this.costExplorer,
        start: firstDayCurrentMonth,
        end: tomorrow,
        services: ["Amazon Simple Email Service"],
        cacheTtlMs: this.costExplorerCacheTtlMs,
      }),
    ]);

    return {
      source: "aws",
      refreshedAt: now.toISOString(),
      official: {
        ses: officialSpend,
        credits,
      },
      manual: {
        costExplorer: manualCost,
      },
    };
  }

  private async getSmsAttributes() {
    try {
      const response = await this.sns.send(
        new GetSMSAttributesCommand({ attributes: ["MonthlySpendLimit"] })
      );
      const rawLimit = response.attributes?.MonthlySpendLimit;

      return {
        available: true,
        monthlySpendLimitUsd: rawLimit ? Number(rawLimit) : null,
        error: null,
      };
    } catch (error) {
      return {
        available: false,
        monthlySpendLimitUsd: null,
        error: getErrorMessage(error),
      };
    }
  }
}
