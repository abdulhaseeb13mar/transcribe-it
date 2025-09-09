import { Hono } from "hono";
// import { cors } from "hono/cors";
import type { Env } from "./worker-env";
import { registerDocumentRoutes } from "./hono/documents";
import { registerAuthRoutes } from "./hono/authRoutes";
import { registerCreditRoutes } from "./hono/credits";
import { registerPlanRoutes } from "./hono/plans";
import { registerPaymentRoutes } from "./hono/payments";
import { registerAdminRoutes } from "./hono/admin";
import { registerUserRoutes } from "./hono/users";

const app = new Hono<{ Bindings: Env }>();

// Request logger
app.use("/*", async (c, next) => {
  // Make env visible to services that don't receive c.env directly
  (globalThis as any).__APP_ENV = c.env;
  const origin = c.req.header("Origin");
  const acrh = c.req.header("Access-Control-Request-Headers");
  const acrm = c.req.header("Access-Control-Request-Method");
  const url = new URL(c.req.url);
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  console.log(`[REQ ${id}] ${c.req.method} ${url.pathname} origin=${origin ?? "-"} acrm=${acrm ?? "-"} acrh=${acrh ?? "-"}`);
  await next();
  console.log(`[RES ${id}] status=${c.res.status}`);
});

// CORS allow-list with logs and proper preflight handling
function resolveAllowedOrigin(origin: string | undefined, list: string[]): string | null {
  if (!list.length) return null;
  if (!origin) return list[0];
  if (list.includes(origin)) return origin;
  try {
    const o = new URL(origin);
    for (const item of list) {
      const a = new URL(item);
      if (a.protocol === o.protocol && a.port === o.port) {
        const hostA = a.hostname;
        const hostO = o.hostname;
        if ((hostA === "localhost" && hostO === "127.0.0.1") || (hostA === "127.0.0.1" && hostO === "localhost")) {
          return origin;
        }
      }
    }
  } catch {}
  return null;
}

app.use("/*", async (c, next) => {
  const raw = c.env.CORS_ORIGIN || "http://localhost:5173";
  const allowList = raw.split(/[,\s]+/).filter(Boolean);
  const reqOrigin = c.req.header("Origin");
  const chosen = resolveAllowedOrigin(reqOrigin, allowList);

  console.log(`[CORS] origin=${reqOrigin ?? "-"} allowList=${JSON.stringify(allowList)} chosen=${chosen ?? "reject"}`);

  if (chosen) {
    c.header("Access-Control-Allow-Origin", chosen);
    c.header("Vary", "Origin");
    c.header("Access-Control-Allow-Credentials", "true");
  }

  if (c.req.method === "OPTIONS") {
    const reqHeaders = c.req.header("Access-Control-Request-Headers");
    const reqMethod = c.req.header("Access-Control-Request-Method") || "GET,POST,PUT,PATCH,DELETE,OPTIONS";
    c.header("Access-Control-Allow-Methods", reqMethod);
    c.header("Access-Control-Max-Age", "86400");
    if (reqHeaders) c.header("Access-Control-Allow-Headers", reqHeaders);
    else c.header("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept, Origin");
    console.log(`[CORS] preflight allowMethods=${reqMethod} allowHeaders=${reqHeaders ?? "default"}`);
    return c.body(null, 204);
  }
  await next();
});

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: c.env.NODE_ENV || "development",
  });
});

// API routes
registerDocumentRoutes(app as any);
registerAuthRoutes(app as any);
registerCreditRoutes(app as any);
registerPlanRoutes(app as any);
registerPaymentRoutes(app as any);
registerAdminRoutes(app as any);
registerUserRoutes(app as any);

// 404 handler
app.all("*", (c) => c.json({ success: false, error: { message: "Not Found" } }, 404));

export default app;
export type { Env };
