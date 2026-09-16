import assert from "node:assert/strict";
import test from "node:test";
import type { Campaign } from "@reciclotron/contracts";

const campaign: Campaign = {
  id: "campaign-test",
  name: "Campanha de teste",
  channel: "email",
  status: "scheduled",
  subject: "Teste dry run",
  message: "Mensagem de teste",
  attachments: [],
  segmentId: null,
  estimatedCost: 0,
  providerMessageId: null,
  sentAt: null,
  createdAt: "2026-09-16T00:00:00.000Z",
  updatedAt: "2026-09-16T00:00:00.000Z"
};

test("dry run usa todos os destinatários reais sem chamar a Amazon SES", async () => {
  const previousDryRun = process.env.EMAIL_DRY_RUN;
  const previousSupabaseUrl = process.env.SUPABASE_URL;
  const previousSupabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.EMAIL_DRY_RUN = "true";
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY = "dry-run-test-key";

  try {
    const { EmailDispatchService } = await import("./email-dispatch.service.js");
    const service = new EmailDispatchService({} as never);
    const result = await service.send(campaign, [
      { legacyId: 1, email: "primeiro@example.com" },
      { legacyId: 2, email: "segundo@example.com" }
    ]);

    assert.deepEqual(result, {
      providerMessageId: "dry-run",
      accepted: 2,
      rejected: 0
    });
  } finally {
    if (previousDryRun === undefined) delete process.env.EMAIL_DRY_RUN;
    else process.env.EMAIL_DRY_RUN = previousDryRun;
    if (previousSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousSupabaseUrl;
    if (previousSupabaseKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY;
    else process.env.SUPABASE_PUBLISHABLE_KEY = previousSupabaseKey;
  }
});
