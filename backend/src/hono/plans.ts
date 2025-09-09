import { Hono } from "hono";
import type { Env } from "../worker-env";
import { withSupabaseAuth, getUser } from "./auth";
import { createPrisma } from "../lib/prisma-edge";

type App = Hono<{ Bindings: Env }>;

export const registerPlanRoutes = (app: App) => {
  // GET /api/plans — active plans + current subscription for user's organization
  app.get("/api/plans", withSupabaseAuth(), async (c) => {
    const u = getUser(c);
    const prisma = createPrisma(c.env);
    try {
      const plans = await prisma.plan.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
      let currentSubscription: any = null;
      if (u?.email) {
        const user = await prisma.user.findUnique({ where: { email: u.email } });
        if (user?.organizationId) {
          const billing = await prisma.billing.findUnique({
            where: { organizationId: user.organizationId },
            include: { plan: true },
          });
          if (billing) {
            currentSubscription = {
              planId: billing.planId,
              plan: billing.plan,
              status: billing.subscriptionStatus,
              currentPeriodStart: billing.currentPeriodStart,
              currentPeriodEnd: billing.currentPeriodEnd,
              cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
            };
          }
        }
      }
      return c.json({ success: true, message: "Plans fetched", data: { plans, currentSubscription } });
    } finally {
      await prisma.$disconnect();
    }
  });

  // POST /api/plans/subscribe — not implemented yet
  app.post("/api/plans/subscribe", withSupabaseAuth(), async (c) => {
    return c.json({
      success: false,
      message: "Subscription not yet available on Workers. Pending payments/DB migration.",
      error: { message: "NOT_IMPLEMENTED" },
    }, 501);
  });

  // POST /api/plans/subscribe { planId } — immediate apply (no Stripe). Admins only.
  app.post("/api/plans/subscribe", withSupabaseAuth(), async (c) => {
    const u = getUser(c);
    const body = await c.req.json().catch(() => ({}));
    const planId = body?.planId as string | undefined;
    if (!u?.email) return c.json({ success: false, message: "Authenticated user email not found" }, 400);
    if (!planId) return c.json({ success: false, message: "'planId' is required" }, 400);

    const prisma = createPrisma(c.env);
    try {
      const user = await prisma.user.findUnique({ where: { email: u.email } });
      if (!user || !user.organizationId) return c.json({ success: false, message: "User is not associated with any organization" }, 400);
      if (user.role !== "ADMIN") return c.json({ success: false, message: "Only organization admins can subscribe to plans" }, 403);

      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan || !plan.isActive) return c.json({ success: false, message: "Plan not found or inactive" }, 404);

      const orgId = user.organizationId;
      const [updatedOrg, updatedBilling, creditLog] = await prisma.$transaction([
        prisma.organization.update({ where: { id: orgId }, data: { credits: { increment: plan.credits } } }),
        prisma.billing.upsert({
          where: { organizationId: orgId },
          update: { planId: plan.id, subscriptionStatus: "ACTIVE" },
          create: { organizationId: orgId, planId: plan.id, subscriptionStatus: "ACTIVE" },
          include: { plan: true },
        }),
        prisma.creditUsage.create({
          data: {
            organizationId: orgId,
            creditsUsed: -plan.credits,
            operation: "plan_purchase",
            metadata: { planId: plan.id, planName: plan.name, creditsAdded: plan.credits },
          },
        }),
      ]);

      return c.json({
        success: true,
        message: "Plan subscribed and credits added",
        data: {
          organization: { id: updatedOrg.id, credits: updatedOrg.credits },
          subscription: { planId: updatedBilling.planId, plan: updatedBilling.plan, status: updatedBilling.subscriptionStatus },
          creditLogId: creditLog.id,
        },
      });
    } finally {
      await prisma.$disconnect();
    }
  });

  // ===== Admin routes =====
  // GET /api/admin/plans
  app.get("/api/admin/plans", withSupabaseAuth(), async (c) => {
    const prisma = createPrisma(c.env);
    try {
      const page = Number(c.req.query("page") ?? 1) || 1;
      const limit = Number(c.req.query("limit") ?? 10) || 10;
      const sort = (c.req.query("sort") ?? "asc") as "asc" | "desc";
      const sortBy = (c.req.query("sortBy") ?? "createdAt") as any;
      const type = c.req.query("type") ?? undefined;
      const isActive = c.req.query("isActive");

      const where: any = {};
      if (typeof type !== "undefined") where.type = type;
      if (typeof isActive !== "undefined") where.isActive = isActive === "true";

      const orderBy: any = { [sortBy]: sort };
      const skip = (page - 1) * limit;

      const [total, plans] = await Promise.all([
        prisma.plan.count({ where }),
        prisma.plan.findMany({ where, orderBy, skip, take: limit }),
      ]);
      return c.json({ success: true, message: "Plans retrieved successfully", data: { plans, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } } });
    } finally {
      await prisma.$disconnect();
    }
  });

  // GET /api/admin/plans/active
  app.get("/api/admin/plans/active", withSupabaseAuth(), async (c) => {
    const prisma = createPrisma(c.env);
    try {
      const plans = await prisma.plan.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } });
      return c.json({ success: true, message: "Active plans retrieved successfully", data: { plans } });
    } finally {
      await prisma.$disconnect();
    }
  });

  // GET /api/admin/plans/:id
  app.get("/api/admin/plans/:id", withSupabaseAuth(), async (c) => {
    const id = c.req.param("id");
    const prisma = createPrisma(c.env);
    try {
      const plan = await prisma.plan.findUnique({ where: { id } });
      if (!plan) return c.json({ success: false, message: "Plan not found" }, 404);
      return c.json({ success: true, message: "Plan retrieved successfully", data: { plan } });
    } finally {
      await prisma.$disconnect();
    }
  });

  // POST /api/admin/plans
  app.post("/api/admin/plans", withSupabaseAuth(), async (c) => {
    const u = getUser(c);
    if (u?.role !== "SUPER_ADMIN") return c.json({ success: false, message: "Insufficient permissions. Super admin access required." }, 403);
    const body = await c.req.json().catch(() => ({}));
    const prisma = createPrisma(c.env);
    try {
      const exists = await prisma.plan.findUnique({ where: { name: body?.name } });
      if (exists) return c.json({ success: false, message: "Plan with this name already exists" }, 400);
      const plan = await prisma.plan.create({ data: { name: body.name, type: body.type, credits: body.credits, price: body.price, description: body.description ?? null, isActive: body.isActive ?? true } });
      return c.json({ success: true, message: "Plan created successfully", data: { plan } }, 201);
    } catch (e: any) {
      const msg = (e?.message || "").toString();
      return c.json({ success: false, message: `Failed to create plan: ${msg}` }, 400);
    } finally {
      await prisma.$disconnect();
    }
  });

  // PUT /api/admin/plans/:id
  app.put("/api/admin/plans/:id", withSupabaseAuth(), async (c) => {
    const u = getUser(c);
    if (u?.role !== "SUPER_ADMIN") return c.json({ success: false, message: "Insufficient permissions. Super admin access required." }, 403);
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const prisma = createPrisma(c.env);
    try {
      const existing = await prisma.plan.findUnique({ where: { id } });
      if (!existing) return c.json({ success: false, message: "Plan not found" }, 404);
      if (body.name && body.name !== existing.name) {
        const dup = await prisma.plan.findUnique({ where: { name: body.name } });
        if (dup) return c.json({ success: false, message: "Plan with this name already exists" }, 400);
      }
      const updated = await prisma.plan.update({ where: { id }, data: { ...(body.name && { name: body.name }), ...(body.type && { type: body.type }), ...(typeof body.credits === "number" && { credits: body.credits }), ...(typeof body.price !== "undefined" && { price: body.price }), ...(typeof body.description !== "undefined" && { description: body.description }), ...(typeof body.isActive !== "undefined" && { isActive: body.isActive }) } });
      return c.json({ success: true, message: "Plan updated successfully", data: { plan: updated } });
    } finally {
      await prisma.$disconnect();
    }
  });

  // DELETE /api/admin/plans/:id
  app.delete("/api/admin/plans/:id", withSupabaseAuth(), async (c) => {
    const u = getUser(c);
    if (u?.role !== "SUPER_ADMIN") return c.json({ success: false, message: "Insufficient permissions. Super admin access required." }, 403);
    const id = c.req.param("id");
    const prisma = createPrisma(c.env);
    try {
      const existing = await prisma.plan.findUnique({ where: { id } });
      if (!existing) return c.json({ success: false, message: "Plan not found" }, 404);
      await prisma.plan.delete({ where: { id } });
      return c.json({ success: true, message: "Plan deleted successfully" });
    } catch (e: any) {
      const msg = (e?.message || "").toString();
      return c.json({ success: false, message: `Failed to delete plan: ${msg}` }, 400);
    } finally {
      await prisma.$disconnect();
    }
  });
};
