import type { FastifyInstance } from "fastify";
import { AppError } from "../shared/errors/app-error.js";
import { verifyPassword } from "../shared/utils/hash.js";

export class AuthService {
  constructor(private app: FastifyInstance) {}

  async login(email: string, password: string) {
    const user = await this.app.container.repositories.adminUsers.findByEmail(email);
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new AppError(401, "Credenciais inválidas.");
    }
    const lastLoginAt = new Date().toISOString();
    await this.app.container.repositories.adminUsers.updateLastLogin(user.id, lastLoginAt);
    const token = await this.app.jwt.sign({ sub: user.id, email: user.email, role: user.role });
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }
}
