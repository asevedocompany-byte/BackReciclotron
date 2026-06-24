import { AppError } from "../shared/errors/app-error.js";
export class AutomationRuleService {
    app;
    constructor(app) {
        this.app = app;
    }
    list() {
        return this.app.container.repositories.automationRules.findAll();
    }
    create(input) {
        return this.app.container.repositories.automationRules.create(input);
    }
    async getById(id) {
        const all = await this.app.container.repositories.automationRules.findAll();
        return all.find((r) => r.id === id) ?? null;
    }
    async setActive(id, active) {
        const rule = await this.getById(id);
        if (!rule)
            throw new AppError(404, "Automation rule not found.");
        return this.app.container.repositories.automationRules.update({ ...rule, active });
    }
}
//# sourceMappingURL=automation-rule.service.js.map