import type { FastifyInstance } from 'fastify';

type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  attachments: string[];
};

type CreateEmailTemplateInput = {
  name: string;
  subject?: string;
  body: string;
  attachments?: string[];
};

const nowId = () => `template_${Math.random().toString(36).slice(2, 10)}`;

const templates: EmailTemplate[] = [];

export class EmailTemplateService {
  constructor(private app: FastifyInstance) {}

  async list() {
    void this.app;
    return [...templates];
  }

  async create(input: CreateEmailTemplateInput) {
    const item: EmailTemplate = {
      id: nowId(),
      name: input.name.trim(),
      subject: (input.subject ?? '').trim(),
      body: input.body.trim(),
      attachments: input.attachments ?? []
    };
    templates.push(item);
    return item;
  }
}
