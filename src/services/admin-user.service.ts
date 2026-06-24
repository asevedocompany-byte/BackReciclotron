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

export class AdminUserService {
  constructor(private app: FastifyInstance) {}

  async list(): Promise<AdminUserListItem[]> {
    const users = await this.app.container.repositories.adminUsers.findAll();
    return users.map(({ id, email, name, role, lastLoginAt, createdAt, updatedAt }) => ({
      id,
      email,
      name,
      role,
      lastLoginAt,
      createdAt,
      updatedAt
    }));
  }
}
