export class MockSmsProvider {
    async estimateCost(input) {
        const units = Math.max(1, Math.ceil(input.message.length / 160));
        return { recipients: input.recipients.length, estimatedCost: Number((input.recipients.length * units * 0.12).toFixed(2)) };
    }
    async sendCampaign(input) {
        return { providerMessageId: `sms_${Date.now()}`, accepted: input.recipients.length };
    }
}
//# sourceMappingURL=index.js.map