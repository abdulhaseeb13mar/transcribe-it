import { createClient } from "@supabase/supabase-js";
import type { Env } from "../worker-env";
import type { Context, MiddlewareHandler } from "hono";

export type AuthedUser = {
  id: string;
  email: string;
  role?: string;
};

export const withSupabaseAuth = (): MiddlewareHandler<{ Bindings: Env; Variables: { user?: AuthedUser } }> => {
  return async (c, next) => {
    const auth = c.req.header("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      console.log(`[AUTH] missing bearer token`);
      return c.json({ success: false, error: { message: "Authentication token required" } }, 401);
    }
    const token = auth.slice(7);
    const supabaseUrl = c.env.SUPABASE_URL;
    const supabaseAnonKey = c.env.SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: fetch.bind(globalThis) },
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      console.log(`[AUTH] invalid token error=${error?.message || "-"}`);
      return c.json({ success: false, error: { message: "Invalid or expired token" } }, 401);
    }
    const user: AuthedUser = {
      id: data.user.id,
      email: data.user.email || "",
      role: (data.user as any)?.user_metadata?.role,
    };
    console.log(`[AUTH] ok user=${user.email}`);
    c.set("user", user);
    await next();
  };
};

export const getUser = (c: Context<{ Variables: { user?: AuthedUser } }>): AuthedUser | undefined => c.get("user");
