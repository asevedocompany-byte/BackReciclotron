import { z } from "zod";
import { SmsRecipientResolverService } from "../services/sms/sms-recipient-resolver.service.js";
import { SmsDispatchService } from "../services/sms/sms-dispatch.service.js";
const resolveRecipientsSchema = z.object({
    recipientIds: z.array(z.union([z.string(), z.number()])).min(1),
    message: z.string().max(500)
});
const previewDispatchSchema = z.object({
    recipientIds: z.array(z.union([z.string(), z.number()])).min(1),
    message: z.string().min(1).max(500),
    campaignId: z.string().optional()
});
export class SmsController {
    async resolveRecipients(request, reply) {
        const input = resolveRecipientsSchema.parse(request.body);
        console.info("[SmsController] resolveRecipients raw body", {
            body: request.body,
            bodyJson: JSON.stringify(request.body)
        });
        console.info("[SmsController] resolveRecipients parsed input", {
            recipientIdsCount: input.recipientIds.length,
            messageLength: input.message.length
        });
        const service = new SmsRecipientResolverService(request.server);
        const recipients = await service.resolveByIds(input.recipientIds);
        console.info("[SmsController] recipients resolved", {
            total: recipients.length,
            valid: recipients.filter((recipient) => recipient.isValid).length,
            invalid: recipients.filter((recipient) => !recipient.isValid).length
        });
        return reply.send({
            total: recipients.length,
            valid: recipients.filter((recipient) => recipient.isValid).length,
            invalid: recipients.filter((recipient) => !recipient.isValid).length,
            recipients
        });
    }
    async previewDispatch(request, reply) {
        console.info("[SmsController] previewDispatch raw body", {
            body: request.body,
            bodyJson: JSON.stringify(request.body)
        });
        const input = previewDispatchSchema.parse(request.body);
        console.info("[SmsController] previewDispatch parsed input", {
            campaignId: input.campaignId ?? null,
            recipientIdsCount: input.recipientIds.length,
            messageLength: input.message.length
        });
        const resolver = new SmsRecipientResolverService(request.server);
        const resolvedRecipients = await resolver.resolveByIds(input.recipientIds);
        console.info("[SmsController] previewDispatch recipients resolved", {
            total: resolvedRecipients.length,
            valid: resolvedRecipients.filter((recipient) => recipient.isValid).length,
            invalid: resolvedRecipients.filter((recipient) => !recipient.isValid).length
        });
        const payload = {
            campaignId: input.campaignId ?? `sms_preview_${Date.now()}`,
            message: input.message,
            recipients: resolvedRecipients.filter((recipient) => recipient.isValid),
            totalRecipients: resolvedRecipients.length
        };
        console.info("[SmsController] previewDispatch payload created", {
            campaignId: payload.campaignId,
            totalRecipients: payload.totalRecipients,
            validRecipients: payload.recipients.length
        });
        console.info("[SmsController] calling dispatch service", {
            campaignId: payload.campaignId
        });
        const dispatchService = new SmsDispatchService(request.server);
        const preview = await dispatchService.preview(payload);
        console.info("[SmsController] previewDispatch finished without AWS send", {
            campaignId: payload.campaignId,
            previewRecipients: preview.recipients.length
        });
        return reply.code(202).send({
            message: "Payload montado com sucesso. Envio real nao executado.",
            preview
        });
    }
}
//# sourceMappingURL=sms.controller.js.map