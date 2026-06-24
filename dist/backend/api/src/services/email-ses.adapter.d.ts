type SendSesEmailInput = {
    recipient: string;
    subject?: string;
    message: string;
    campaignId?: string;
};
type SendSesEmailResult = {
    messageId: string;
};
export declare class AmazonSesEmailAdapter {
    private readonly client;
    private readonly config;
    sendEmail(input: SendSesEmailInput): Promise<SendSesEmailResult>;
}
export {};
