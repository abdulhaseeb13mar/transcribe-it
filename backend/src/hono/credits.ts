import { Hono } from "hono";
import type { Env } from "../worker-env";
import { withSupabaseAuth, getUser } from "./auth";
import { createPrisma } from "../lib/prisma-edge";

type App = Hono<{ Bindings: Env }>;

export const registerCreditRoutes = (app: App) => {
  // GET /api/credits/me — uses Prisma Edge via Accelerate
  app.get("/api/credits/me", withSupabaseAuth(), async (c) => {
    const u = getUser(c);
    console.log(`[CREDITS:me] user=${u?.email ?? "-"}`);
    if (!u?.email) return c.json({ success: false, message: "Authenticated user email not found" }, 400);

    const prisma = createPrisma(c.env);
    try {
      const user = await prisma.user.findUnique({ where: { email: u.email } });
      if (!user || !user.organizationId) {
        return c.json({ success: false, message: "User is not associated with any organization" }, 400);
      }

      const [org, recent] = await Promise.all([
        prisma.organization.findUnique({ where: { id: user.organizationId }, select: { id: true, name: true, credits: true } }),
        prisma.creditUsage.findMany({
          where: { organizationId: user.organizationId },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      if (!org) return c.json({ success: false, message: "Organization not found" }, 404);
      return c.json({
        success: true,
        message: "Credits fetched",
        data: {
          organization: { id: org.id, name: org.name },
          credits: org.credits,
          recentUsage: recent,
        },
      });
    } finally {
      await prisma.$disconnect();
    }
  });
};
