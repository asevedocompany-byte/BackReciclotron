import fp from "fastify-plugin";
import { getConfig } from "@reciclotron/config";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

function getRouteKey(request: { routeOptions?: { url?: string }; method: string; url: string }) {
  const routeUrl = request.routeOptions?.url;
  if (routeUrl) {
    return `${request.method}:${routeUrl}`;
  }
  return `${request.method}:${request.url.split("?")[0]}`;
}

function isSseRoute(routeKey: string) {
  return routeKey.includes("/status/stream") || routeKey.includes("/campaigns/") && routeKey.includes("/stream");
}

export default fp(async (app) => {
  const config = getConfig();
  const store = new Map<string, RateLimitEntry>();
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt <= now) {
        store.delete(key);
      }
    }
  }, 60_000);

  cleanupTimer.unref?.();

  app.addHook("onRequest", async (request, reply) => {
    const routeKey = getRouteKey({
      routeOptions: request.routeOptions,
      method: request.method,
      url: request.raw.url ?? request.url
    });

    if (
      routeKey.includes("GET:/health")
      || routeKey.includes("POST:/auth/login") === false && isSseRoute(routeKey)
    ) {
      return;
    }

    const isLoginRoute = routeKey.includes("POST:/auth/login");
    const limit = isLoginRoute ? config.RATE_LIMIT_LOGIN_MAX : config.RATE_LIMIT_MAX;
    const windowMs = isLoginRoute ? config.RATE_LIMIT_LOGIN_TIME_WINDOW_MS : config.RATE_LIMIT_TIME_WINDOW_MS;
    const key = `${request.ip}:${routeKey}`;
    const now = Date.now();
    const current = store.get(key);

    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    current.count += 1;
    if (current.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
      reply.header("Retry-After", String(retryAfter));
      return reply.code(429).send({
        message: "Muitas requisições. Tente novamente em instantes."
      });
    }
  });

  app.addHook("onClose", async () => {
    clearInterval(cleanupTimer);
    store.clear();
  });
});
