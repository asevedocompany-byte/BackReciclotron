import type { SmsProvider } from "@reciclotron/domain";

export class MockSmsProvider implements SmsProvider {
  async estimateCost(input: { recipients: string[]; message: string; }) {
    void input.message;
    return { recipients: input.recipients.length, estimatedCost: Number((input.recipients.length * 0.02297).toFixed(5)) };
  }
  async sendCampaign(input: { message: string; recipients: string[]; }) {
    return { providerMessageId: `sms_${Date.now()}`, accepted: input.recipients.length };
  }
}
