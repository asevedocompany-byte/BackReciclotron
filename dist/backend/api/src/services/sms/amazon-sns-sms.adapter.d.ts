import type { SmsCampaignDispatchJob, SmsDispatchResult } from "./sms.types.js";
type SendOneInput = {
    campaignId: string;
    message: string;
    phoneNumber: string;
};
export declare class AmazonSnsSmsAdapter {
    send(job: SmsCampaignDispatchJob, signal?: AbortSignal): Promise<SmsDispatchResult>;
    sendOne(input: SendOneInput, signal?: AbortSignal): Promise<SmsDispatchResult>;
}
export {};
