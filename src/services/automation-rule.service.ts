import type { FastifyInstance } from "fastify";
import type { CreateAutomationRuleInput } from "@reciclotron/contracts";
import { AppError } from "../shared/errors/app-error.js";

export class AutomationRuleService {
  constructor(private app: FastifyInstance) {}

  list() {
    return this.app.container.repositories.automationRules.findAll();
  }

  create(input: CreateAutomationRuleInput) {
    return this.app.container.repositories.automationRules.create(input);
  }

  async getById(id: string) {
    const all = await this.app.container.repositories.automationRules.findAll();
    return all.find((r) => r.id === id) ?? null;
  }

  async setActive(id: string, active: boolean) {
    const rule = await this.getById(id);
    if (!rule) throw new AppError(404, "Automation rule not found.");
    return this.app.container.repositories.automationRules.update({ ...rule, active });
  }
}
