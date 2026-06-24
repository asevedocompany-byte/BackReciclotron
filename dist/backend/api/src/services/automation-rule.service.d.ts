import type { FastifyInstance } from "fastify";
import type { CreateAutomationRuleInput } from "@reciclotron/contracts";
export declare class AutomationRuleService {
    private app;
    constructor(app: FastifyInstance);
    list(): Promise<{
        active: boolean;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        channel: "email" | "sms";
        segmentId: string | null;
        trigger: "user_inactive" | "high_points_balance" | "manual_event";
        template: string;
    }[]>;
    create(input: CreateAutomationRuleInput): Promise<{
        id: string;
        createdAt: string;
        updatedAt: string;
        active: boolean;
        name: string;
        channel: "email" | "sms";
        segmentId: string | null;
        trigger: "user_inactive" | "high_points_balance" | "manual_event";
        template: string;
    }>;
    getById(id: string): Promise<{
        active: boolean;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        channel: "email" | "sms";
        segmentId: string | null;
        trigger: "user_inactive" | "high_points_balance" | "manual_event";
        template: string;
    } | null>;
    setActive(id: string, active: boolean): Promise<{
        active: boolean;
        createdAt: string;
        updatedAt: string;
        id: string;
        name: string;
        channel: "email" | "sms";
        segmentId: string | null;
        trigger: "user_inactive" | "high_points_balance" | "manual_event";
        template: string;
    }>;
}
