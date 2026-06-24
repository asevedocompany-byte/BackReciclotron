import type { FastifyInstance } from "fastify";
type AdminUserListItem = {
    id: string;
    email: string;
    name: string;
    role: "super_admin" | "operator" | "analyst";
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
};
export declare class AdminUserService {
    private app;
    constructor(app: FastifyInstance);
    list(): Promise<AdminUserListItem[]>;
}
export {};
