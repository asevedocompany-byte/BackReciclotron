import fp from "fastify-plugin";
import { createClient } from "@supabase/supabase-js";
import { getConfig } from "@reciclotron/config";
import { AppError } from "../shared/errors/app-error.js";

export default fp(async (app) => {
  const config = getConfig();
  const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  });

  app.decorate("authenticate", async (request: any) => {
    const authorization = request.headers.authorization;
    const match = typeof authorization === "string" ? authorization.match(/^Bearer\s+(.+)$/i) : null;
    const logContext = {
      requestId: request.id,
      method: request.method,
      url: request.url,
      ip: request.ip,
      hasBearerToken: Boolean(match)
    };

    console.info("[Auth] validação iniciada", logContext);

    if (!match) {
      console.warn("[Auth] acesso negado: token ausente", logContext);
      throw new AppError(401, "Sessão administrativa ausente.");
    }

    const { data, error } = await supabase.auth.getUser(match[1]);
    if (error || !data.user) {
      console.warn("[Auth] acesso negado: token Supabase inválido ou expirado", {
        ...logContext,
        error: error?.message ?? "usuário não encontrado"
      });
      throw new AppError(401, "Sessão administrativa inválida ou expirada.");
    }

    console.info("[Auth] usuário identificado no Supabase Auth", {
      ...logContext,
      userId: data.user.id,
      email: data.user.email
    });

    const admin = await app.container.repositories.adminUsers.findById(data.user.id);
    if (!admin) {
      console.warn("[Auth] acesso negado: usuário não está em admin_users", {
        ...logContext,
        userId: data.user.id,
        email: data.user.email
      });
      throw new AppError(403, "Usuário não autorizado para o painel administrativo.");
    }

    request.user = {
      sub: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role
    };

    console.info("[Auth] acesso administrativo autorizado", {
      ...logContext,
      userId: admin.id,
      email: admin.email,
      role: admin.role
    });
  });
});

declare module "fastify" {
  interface FastifyInstance { authenticate(request: any, reply: any): Promise<void>; }
  interface FastifyRequest { user: { sub: string; email: string; name: string; role: "super_admin" | "operator" | "analyst" }; }
}
