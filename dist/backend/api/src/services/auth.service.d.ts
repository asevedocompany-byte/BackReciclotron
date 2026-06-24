import type { FastifyInstance } from "fastify";
export declare class AuthService {
    private app;
    constructor(app: FastifyInstance);
    login(email: string, password: string): Promise<{
        token: string;
        user: {
            id: string;
            email: string;
            name: string;
            role: "super_admin" | "operator" | "analyst";
        };
    }>;
}
