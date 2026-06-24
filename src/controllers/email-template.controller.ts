import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { EmailTemplateService } from '../services/email/email-template.service.js';

const createEmailTemplateSchema = z.object({
  name: z.string().min(2),
  subject: z.string().optional(),
  body: z.string().min(2),
  attachments: z.array(z.string()).optional()
});

export class EmailTemplateController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await new EmailTemplateService(request.server).list());
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = createEmailTemplateSchema.parse(request.body);
    return reply.code(201).send(await new EmailTemplateService(request.server).create(input));
  }
}
