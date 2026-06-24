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
export declare class EmailTemplateService {
    private app;
    constructor(app: FastifyInstance);
    list(): Promise<EmailTemplate[]>;
    create(input: CreateEmailTemplateInput): Promise<EmailTemplate>;
}
export {};
