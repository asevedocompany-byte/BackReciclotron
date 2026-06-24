const nowId = () => `sms_template_${Math.random().toString(36).slice(2, 10)}`;
const templates = [];
export class SmsTemplateService {
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
            message: input.message.trim()
        };
        templates.push(item);
        return item;
    }
}
//# sourceMappingURL=sms-template.service.js.map