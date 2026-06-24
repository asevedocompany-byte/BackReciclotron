import type { EmailProvider, SmsProvider } from "@reciclotron/domain";
export declare class MockEmailProvider implements EmailProvider {
    sendCampaign(input: {
        subject?: string;
        message: string;
        recipients: string[];
    }): Promise<{
        providerMessageId: string;
        accepted: number;
    }>;
}
export declare class MockSmsProvider implements SmsProvider {
    estimateCost(input: {
        recipients: string[];
        message: string;
    }): Promise<{
        recipients: number;
        estimatedCost: number;
    }>;
    sendCampaign(input: {
        message: string;
        recipients: string[];
    }): Promise<{
        providerMessageId: string;
        accepted: number;
    }>;
}
