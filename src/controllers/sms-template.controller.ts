import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { SmsTemplateService } from '../services/sms-template.service.js';

const createSmsTemplateSchema = z.object({
  name: z.string().min(2),
  message: z.string().min(2)
});

export class SmsTemplateController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await new SmsTemplateService(request.server).list());
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    const input = createSmsTemplateSchema.parse(request.body);
    return reply.code(201).send(await new SmsTemplateService(request.server).create(input));
  }
}
