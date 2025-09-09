import { Hono } from "hono";
import type { Env } from "../worker-env";
import { withSupabaseAuth, getUser } from "./auth";
import { createPrisma } from "../lib/prisma-edge";

type App = Hono<{ Bindings: Env }>;

export const registerUserRoutes = (app: App) => {
  // GET /api/users/profile
  app.get("/api/users/profile", withSupabaseAuth(), async (c) => {
    const u = getUser(c);
    if (!u?.id) return c.json({ success: false, message: "User not authenticated" }, 401);
    const prisma = createPrisma(c.env);
    try {
      const user = await prisma.user.findUnique({ where: { id: u.id } });
      if (!user) return c.json({ success: false, message: "User not found" }, 404);
      return c.json({ success: true, message: "Profile retrieved successfully", data: { user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt, updatedAt: user.updatedAt } } });
    } finally {
      await prisma.$disconnect();
    }
  });

  // PUT /api/users/profile { name?, email? }
  app.put("/api/users/profile", withSupabaseAuth(), async (c) => {
    const u = getUser(c);
    if (!u?.id) return c.json({ success: false, message: "User not authenticated" }, 401);
    const body = await c.req.json().catch(() => ({}));
    const { name, email } = body || {};
    const prisma = createPrisma(c.env);
    try {
      const updated = await prisma.user.update({ where: { id: u.id }, data: { ...(name && { name }), ...(email && { email }) } });
      return c.json({ success: true, message: "Profile updated successfully", data: { user: { id: updated.id, email: updated.email, name: updated.name, updatedAt: updated.updatedAt } } });
    } catch (e: any) {
      const msg = (e?.message || "").toString();
      if (e?.code === "P2002") return c.json({ success: false, message: "Email already in use" }, 400);
      if (e?.code === "P2025") return c.json({ success: false, message: "User not found" }, 404);
      return c.json({ success: false, message: `Failed to update user: ${msg}` }, 400);
    } finally {
      await prisma.$disconnect();
    }
  });

  // DELETE /api/users/account
  app.delete("/api/users/account", withSupabaseAuth(), async (c) => {
    const u = getUser(c);
    if (!u?.id) return c.json({ success: false, message: "User not authenticated" }, 401);
    const prisma = createPrisma(c.env);
    try {
      await prisma.user.delete({ where: { id: u.id } });
      return c.json({ success: true, message: "Account deleted successfully" });
    } catch (e: any) {
      if (e?.code === "P2025") return c.json({ success: false, message: "User not found" }, 404);
      return c.json({ success: false, message: `Failed to delete user: ${(e?.message || "").toString()}` }, 400);
    } finally {
      await prisma.$disconnect();
    }
  });
};

