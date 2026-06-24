const nowId = () => `template_${Math.random().toString(36).slice(2, 10)}`;
const templates = [];
export class EmailTemplateService {
    app;
    constructor(app) {
        this.app = app;
    }
    async list() {
        void this.app;
        return [...templates];
    }
    async create(input) {
        const item = {
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
//# sourceMappingURL=email-template.service.js.map