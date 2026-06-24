import type { FastifyReply, FastifyRequest } from "fastify";
import { createAutomationRuleSchema } from "@reciclotron/contracts";
import { AutomationRuleService } from "../services/automation-rule.service.js";

export class AutomationRuleController {
  async list(request: FastifyRequest, reply: FastifyReply) {
    return reply.send(await new AutomationRuleService(request.server).list());
  }

  async create(request: FastifyRequest, reply: FastifyReply) {
    return reply.code(201).send(
      await new AutomationRuleService(request.server).create(
        createAutomationRuleSchema.parse(request.body)
      )
    );
  }

  async getById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const rule = await new AutomationRuleService(request.server).getById(id);
    if (!rule) return reply.code(404).send({ error: "Automation rule not found." });
    return reply.send(rule);
  }

  async activate(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    return reply.send(await new AutomationRuleService(request.server).setActive(id, true));
  }

  async deactivate(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    return reply.send(await new AutomationRuleService(request.server).setActive(id, false));
  }
}
