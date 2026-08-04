type SendSesEmailInput = {
    recipient: string;
    subject?: string;
    message: string;
    attachments?: string[];
    campaignId?: string;
    signal?: AbortSignal;
};
type SendSesEmailResult = {
    messageId: string;
};
export declare class AmazonSesEmailAdapter {
    private readonly client;
    private readonly config;
    sendEmail(input: SendSesEmailInput): Promise<SendSesEmailResult>;
    getSendQuota(): Promise<{
        sentLast24h: number;
        max24hSend: number;
        remaining24h: number;
        maxSendRatePerSec: number;
        isMock: boolean;
    }>;
}
export {};
