import { Router, Request, Response, IRouter } from "express";
import { asyncHandler, sendResponse } from "../utils/helpers";
import { authenticateUser, AuthenticatedRequest } from "../middleware/supabaseAuth";
import { ValidationError } from "../utils/errors";
import { prisma } from "../lib/prisma";
import { UserRole } from "@prisma/client";
import { UserService } from "../services/userService";

const router: IRouter = Router();
const userService = new UserService();

// GET /api/plans - list active plans and the user's current subscription (if any)
router.get(
  "/",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const email = req.user?.email;
    if (!email) throw new ValidationError("Authenticated user email not found");

    const user = await userService.findUserByEmail(email);
    if (!user || !user.organizationId) {
      throw new ValidationError("User is not associated with any organization");
    }

    const [plans, billing] = await Promise.all([
      prisma.plan.findMany({ where: { isActive: true }, orderBy: { createdAt: "asc" } }),
      prisma.billing.findUnique({
        where: { organizationId: user.organizationId },
        include: { plan: true },
      }),
    ]);

    sendResponse(res, 200, true, "Plans fetched", {
      plans,
      currentSubscription: billing
        ? {
            planId: billing.planId,
            plan: billing.plan,
            status: billing.subscriptionStatus,
            currentPeriodStart: billing.currentPeriodStart,
            currentPeriodEnd: billing.currentPeriodEnd,
            cancelAtPeriodEnd: billing.cancelAtPeriodEnd,
          }
        : null,
    });
  })
);

// POST /api/plans/subscribe { planId }
router.post(
  "/subscribe",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const email = req.user?.email;
    const { planId } = req.body || {};
    if (!email) throw new ValidationError("Authenticated user email not found");
    if (!planId) throw new ValidationError("'planId' is required");

    const user = await userService.findUserByEmail(email);
    if (!user || !user.organizationId) {
      throw new ValidationError("User is not associated with any organization");
    }
    if (user.role !== UserRole.ADMIN) {
      throw new ValidationError("Only organization admins can subscribe to plans");
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      throw new ValidationError("Plan not found or inactive");
    }

    // Add credits and set subscription; simple billing logic for now
    const orgId = user.organizationId;
    const [updatedOrg, updatedBilling, creditLog] = await prisma.$transaction([
      prisma.organization.update({
        where: { id: orgId },
        data: { credits: { increment: plan.credits } },
      }),
      prisma.billing.upsert({
        where: { organizationId: orgId },
        update: { planId: plan.id, subscriptionStatus: "ACTIVE" },
        create: {
          organizationId: orgId,
          planId: plan.id,
          subscriptionStatus: "ACTIVE",
        },
        include: { plan: true },
      }),
      prisma.creditUsage.create({
        data: {
          organizationId: orgId,
          creditsUsed: -plan.credits, // negative to represent addition
          operation: "plan_purchase",
          metadata: { planId: plan.id, planName: plan.name, creditsAdded: plan.credits },
        },
      }),
    ]);

    sendResponse(res, 200, true, "Plan subscribed and credits added", {
      organization: { id: updatedOrg.id, credits: updatedOrg.credits },
      subscription: {
        planId: updatedBilling.planId,
        plan: updatedBilling.plan,
        status: updatedBilling.subscriptionStatus,
      },
      creditLogId: creditLog.id,
    });
  })
);

export default router;

