import { Hono } from "hono";
import type { Env } from "../worker-env";
import { withSupabaseAuth, getUser } from "./auth";
import { createPrisma } from "../lib/prisma-edge";

type App = Hono<{ Bindings: Env }>;

export const registerAdminRoutes = (app: App) => {
  // GET /api/admin/super-admin/check
  app.get("/api/admin/super-admin/check", async (c) => {
    const prisma = createPrisma(c.env);
    try {
      const exists = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
      return c.json({ success: true, message: "Super admin existence check completed", data: { exists: Boolean(exists) } });
    } finally {
      await prisma.$disconnect();
    }
  });

  // POST /api/admin/super-admin — create initial super admin (only if none exists)
  app.post("/api/admin/super-admin", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { email, name, password } = body || {};
    if (!email || !name || !password) return c.json({ success: false, message: "'email', 'name', and 'password' are required" }, 400);

    const prisma = createPrisma(c.env);
    try {
      const exists = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
      if (exists) return c.json({ success: false, message: "Super admin already exists. Only one super admin can be created." }, 400);

      // Create Supabase auth user (admin client)
      const admin = (await import("@supabase/supabase-js")).createClient(
        c.env.SUPABASE_URL,
        c.env.SUPABASE_SERVICE_ROLE_KEY || "",
        { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetch.bind(globalThis) } }
      );
      const { data: authUser, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role: "SUPER_ADMIN" },
      });
      if (error) return c.json({ success: false, message: `Failed to create auth user: ${error.message}` }, 400);

      const superAdmin = await prisma.user.create({ data: { email, name, role: "SUPER_ADMIN", organizationId: null } });
      return c.json({ success: true, message: "Super admin created successfully", data: { superAdmin: { id: superAdmin.id, email: superAdmin.email, name: superAdmin.name, role: superAdmin.role, createdAt: superAdmin.createdAt } } }, 201);
    } catch (e: any) {
      return c.json({ success: false, message: (e?.message || "").toString() }, 400);
    } finally {
      await prisma.$disconnect();
    }
  });

  // GET /api/admin/get-organizations (SUPER_ADMIN required)
  app.get("/api/admin/get-organizations", withSupabaseAuth(), async (c) => {
    const u = getUser(c);
    if (u?.role !== "SUPER_ADMIN") return c.json({ success: false, message: "Insufficient permissions. Super admin access required." }, 403);
    const prisma = createPrisma(c.env);
    try {
      const organizations = await prisma.organization.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          users: { where: { role: "ADMIN" }, select: { id: true, name: true, email: true, role: true } },
          billing: { include: { plan: true } },
        },
      });
      return c.json({ success: true, message: "Organizations retrieved successfully", data: { organizations, count: organizations.length } });
    } finally {
      await prisma.$disconnect();
    }
  });

  // GET /api/admin/get-summary (SUPER_ADMIN required)
  app.get("/api/admin/get-summary", withSupabaseAuth(), async (c) => {
    const u = getUser(c);
    if (u?.role !== "SUPER_ADMIN") return c.json({ success: false, message: "Insufficient permissions. Super admin access required." }, 403);
    const prisma = createPrisma(c.env);
    try {
      const [organizationsCount, usersCount] = await Promise.all([
        prisma.organization.count(),
        prisma.user.count(),
      ]);
      return c.json({ success: true, message: "Summary retrieved successfully", data: { organizationsCount, usersCount, summary: { totalOrganizations: organizationsCount, totalUsers: usersCount } } });
    } finally {
      await prisma.$disconnect();
    }
  });
};
