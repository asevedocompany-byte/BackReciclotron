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
export declare class SmsTemplateService {
    private app;
    constructor(app: FastifyInstance);
    list(): Promise<SmsTemplate[]>;
    create(input: CreateSmsTemplateInput): Promise<SmsTemplate>;
}
export {};
