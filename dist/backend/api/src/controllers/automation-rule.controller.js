import { createAutomationRuleSchema } from "@reciclotron/contracts";
import { AutomationRuleService } from "../services/automation-rule.service.js";
export class AutomationRuleController {
    async list(request, reply) {
        return reply.send(await new AutomationRuleService(request.server).list());
    }
    async create(request, reply) {
        return reply.code(201).send(await new AutomationRuleService(request.server).create(createAutomationRuleSchema.parse(request.body)));
    }
    async getById(request, reply) {
        const { id } = request.params;
        const rule = await new AutomationRuleService(request.server).getById(id);
        if (!rule)
            return reply.code(404).send({ error: "Automation rule not found." });
        return reply.send(rule);
    }
    async activate(request, reply) {
        const { id } = request.params;
        return reply.send(await new AutomationRuleService(request.server).setActive(id, true));
    }
    async deactivate(request, reply) {
        const { id } = request.params;
        return reply.send(await new AutomationRuleService(request.server).setActive(id, false));
    }
}
//# sourceMappingURL=automation-rule.controller.js.map