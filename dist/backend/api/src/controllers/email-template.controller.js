import { z } from 'zod';
import { EmailTemplateService } from '../services/email-template.service.js';
const createEmailTemplateSchema = z.object({
    name: z.string().min(2),
    subject: z.string().optional(),
    body: z.string().min(2),
    attachments: z.array(z.string()).optional()
});
export class EmailTemplateController {
    async list(request, reply) {
        return reply.send(await new EmailTemplateService(request.server).list());
    }
    async create(request, reply) {
        const input = createEmailTemplateSchema.parse(request.body);
        return reply.code(201).send(await new EmailTemplateService(request.server).create(input));
    }
}
//# sourceMappingURL=email-template.controller.js.map