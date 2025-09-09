import { Hono } from "hono";
import type { Env } from "../worker-env";
import { createClient } from "@supabase/supabase-js";
import { withSupabaseAuth, getUser } from "./auth";
import { createPrisma } from "../lib/prisma-edge";

type App = Hono<{ Bindings: Env }>;

const createSupabase = (env: Env) =>
  createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetch.bind(globalThis) },
  });

const createSupabaseAdmin = (env: Env) =>
  createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || "", {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetch.bind(globalThis) },
  });

export const registerAuthRoutes = (app: App) => {
  // POST /api/auth/register { email, password, name }
  app.post("/api/auth/register", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { email, password, name } = body || {};
    if (!email || !password || !name) {
      return c.json({ success: false, message: "'email', 'password', and 'name' are required" }, 400);
    }
    const supabase = createSupabase(c.env);
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
    if (error) return c.json({ success: false, message: `Registration failed: ${error.message}` }, 400);

    // Create user profile in DB
    const prisma = createPrisma(c.env);
    try {
      if (data.user) {
        await prisma.user.create({ data: { email: data.user.email || email, name, role: "ADMIN", organizationId: null } });
      }
    } catch (e) {
      // ignore profile creation failure
    } finally {
      await prisma.$disconnect();
    }

    return c.json({ success: true, message: "User registered successfully. Please check your email for verification.", data: { user: { id: data.user?.id, email: data.user?.email, name }, needsEmailVerification: !data.user?.email_confirmed_at } }, 201);
  });
  // POST /api/auth/register-org { email, password, name, orgName }
  // Note: In the Worker version we only create the Supabase user and return a success + needsEmailVerification flag.
  app.post("/api/auth/register-org", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { email, password, name, orgName } = body || {};
    console.log(`[AUTH:register-org] email=${email ?? "-"} org=${orgName ?? "-"}`);
    if (!email || !password || !name || !orgName) {
      return c.json({ success: false, message: "'email', 'password', 'name', and 'orgName' are required" }, 400);
    }
    const supabase = createSupabase(c.env);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role: "ADMIN" } },
    });
    if (error) {
      console.log(`[AUTH:register-org] failed: ${error.message}`);
      return c.json({ success: false, message: `Registration failed: ${error.message}` }, 400);
    }
    // Create organization and user profile immediately
    const prisma = createPrisma(c.env);
    try {
      const organization = await prisma.organization.create({ data: { name: orgName, credits: 0 } });
      if (data.user) {
        await prisma.user.create({ data: { email: data.user.email || email, name, role: "ADMIN", organizationId: organization.id } });
      }
      return c.json({ success: true, message: "Organization and admin user registered successfully. Please check your email for verification.", data: { user: { id: data.user?.id, email: data.user?.email, name, role: "ADMIN" }, organization: { id: organization.id, name: organization.name, credits: organization.credits }, needsEmailVerification: !data.user?.email_confirmed_at } }, 201);
    } catch (e: any) {
      console.log(`[AUTH:register-org] DB creation failed: ${e?.message || e}`);
      return c.json({ success: false, message: `Registration failed: ${(e?.message || "").toString()}` }, 400);
    } finally {
      await prisma.$disconnect();
    }
  });

  // POST /api/auth/login { email, password }
  app.post("/api/auth/login", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const email = body?.email as string | undefined;
    const password = body?.password as string | undefined;
    console.log(`[AUTH:login] email=${email ?? "-"}`);
    if (!email || !password) {
      return c.json({ success: false, message: "'email' and 'password' are required" }, 400);
    }
    const supabase = createSupabase(c.env);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.log(`[AUTH:login] failed: ${error.message}`);
      return c.json({ success: false, message: `Login failed: ${error.message}` }, 401);
    }
    const user = data.user;
    const session = data.session;
    return c.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: (user.user_metadata as any)?.name ?? null,
        },
        token: session?.access_token,
        refreshToken: session?.refresh_token,
        expiresAt: session?.expires_at,
      },
    });
  });

  // POST /api/auth/refresh { refreshToken }
  app.post("/api/auth/refresh", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const refreshToken = body?.refreshToken as string | undefined;
    console.log(`[AUTH:refresh] hasToken=${Boolean(refreshToken)}`);
    if (!refreshToken) {
      return c.json({ success: false, message: "'refreshToken' is required" }, 400);
    }
    const supabase = createSupabase(c.env);
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (error) {
      console.log(`[AUTH:refresh] failed: ${error.message}`);
      return c.json({ success: false, message: `Token refresh failed: ${error.message}` }, 401);
    }
    return c.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        token: data.session?.access_token,
        refreshToken: data.session?.refresh_token,
        expiresAt: data.session?.expires_at,
      },
    });
  });

  // GET /api/auth/me
  app.get("/api/auth/me", withSupabaseAuth(), async (c) => {
    const u = getUser(c);
    console.log(`[AUTH:me] user=${u?.email ?? "-"}`);
    if (!u) return c.json({ success: false, message: "User not found" }, 404);
    return c.json({ success: true, message: "User info retrieved", data: { user: u } });
  });

  // POST /api/auth/logout — frontend clears tokens; Supabase signOut is a no-op without persisted session here.
  app.post("/api/auth/logout", withSupabaseAuth(), async (c) => {
    console.log(`[AUTH:logout] user=${getUser(c)?.email ?? "-"}`);
    return c.json({ success: true, message: "Logout successful" });
  });

  // POST /api/auth/forgot-password { email }
  app.post("/api/auth/forgot-password", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const email = body?.email as string | undefined;
    if (!email) return c.json({ success: false, message: "'email' is required" }, 400);
    const supabase = createSupabase(c.env);
    const redirectTo = `${c.env.CORS_ORIGIN || "http://localhost:3000"}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) return c.json({ success: false, message: `Password reset failed: ${error.message}` }, 400);
    return c.json({ success: true, message: "Password reset email sent successfully" });
  });

  // GET /api/auth/confirm — handles email confirmation redirect
  app.get("/api/auth/confirm", async (c) => {
    const url = new URL(c.req.url);
    const params = url.searchParams;
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    const type = params.get("type");
    const err = params.get("error");
    const errDesc = params.get("error_description");
    const frontend = c.env.FRONTEND_URL || c.env.CORS_ORIGIN || "http://localhost:3000";
    if (err || errDesc) {
      return c.redirect(`${frontend}/auth/confirm?error=${encodeURIComponent(errDesc || err || "Unknown error")}`, 302);
    }
    if (type === "signup" && access_token && refresh_token) {
      return c.redirect(`${frontend}/auth/confirm?confirmed=true&access_token=${encodeURIComponent(access_token)}&refresh_token=${encodeURIComponent(refresh_token)}`, 302);
    }
    return c.redirect(`${frontend}/auth/confirm?error=${encodeURIComponent("Invalid confirmation link")}`, 302);
  });
};
