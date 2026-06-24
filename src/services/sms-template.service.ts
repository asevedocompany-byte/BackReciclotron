import type { FastifyInstance } from 'fastify';

type SmsTemplate = {
  id: string;
  name: string;
  message: string;
};

type CreateSmsTemplateInput = {
  name: string;
  message: string;
};

const nowId = () => `sms_template_${Math.random().toString(36).slice(2, 10)}`;

const templates: SmsTemplate[] = [];

export class SmsTemplateService {
  constructor(private app: FastifyInstance) {}

  async list() {
    void this.app;
    return [...templates];
  }

  async create(input: CreateSmsTemplateInput) {
    const item: SmsTemplate = {
      id: nowId(),
      name: input.name.trim(),
      message: input.message.trim()
    };
    templates.push(item);
    return item;
  }
}
