import { Router, Request, Response, IRouter } from "express";
import { asyncHandler, sendResponse } from "../utils/helpers";
import { authenticateUser, AuthenticatedRequest } from "../middleware/supabaseAuth";
import { ValidationError } from "../utils/errors";
import { prisma } from "../lib/prisma";
import { UserRole } from "@prisma/client";
import { UserService } from "../services/userService";
import { PlanService } from "../services/planService";
import {
  validateBody,
  validateParams,
  validateQuery,
} from "../middleware/validation";
import {
  createPlanSchema,
  updatePlanSchema,
  planQuerySchema,
  CreatePlanInput,
  UpdatePlanInput,
  PlanQueryParams,
} from "../schemas/plan.schema";
import { idParamSchema, IdParam } from "../schemas/common.schema";

// Export two routers from a single module to keep plans endpoints together
export const orgPlansRouter: IRouter = Router();
export const adminPlansRouter: IRouter = Router();

const userService = new UserService();
const planService = new PlanService();

// =============== Org routes (/api/plans) ===============
// GET /api/plans - list active plans and the user's current subscription (if any)
orgPlansRouter.get(
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
orgPlansRouter.post(
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

    // Add credits and set subscription
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
          creditsUsed: -plan.credits,
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

// =============== Admin routes (/api/admin/plans) ===============
// GET /api/admin/plans
adminPlansRouter.get(
  "/",
  validateQuery(planQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const queryParams = req.query as unknown as PlanQueryParams;
    const { plans, pagination } = await planService.getPlans(queryParams);
    sendResponse(res, 200, true, "Plans retrieved successfully", { plans, pagination });
  })
);

// GET /api/admin/plans/active
adminPlansRouter.get(
  "/active",
  asyncHandler(async (req: Request, res: Response) => {
    const plans = await planService.getActivePlans();
    sendResponse(res, 200, true, "Active plans retrieved successfully", { plans });
  })
);

// GET /api/admin/plans/:id
adminPlansRouter.get(
  "/:id",
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as IdParam;
    const plan = await planService.getPlanById(id);
    if (!plan) {
      throw new ValidationError("Plan not found");
    }
    sendResponse(res, 200, true, "Plan retrieved successfully", { plan });
  })
);

// POST /api/admin/plans
adminPlansRouter.post(
  "/",
  authenticateUser,
  validateBody(createPlanSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const planData = req.body as CreatePlanInput;
    const existingPlan = await planService.getPlanByName(planData.name);
    if (existingPlan) {
      throw new ValidationError("Plan with this name already exists");
    }
    const plan = await planService.createPlan(planData);
    sendResponse(res, 201, true, "Plan created successfully", { plan });
  })
);

// PUT /api/admin/plans/:id
adminPlansRouter.put(
  "/:id",
  authenticateUser,
  validateParams(idParamSchema),
  validateBody(updatePlanSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.role !== "SUPER_ADMIN") {
      throw new ValidationError("Insufficient permissions. Super admin access required.");
    }
    const { id } = req.params as IdParam;
    const planData = req.body as UpdatePlanInput;
    const existingPlan = await planService.getPlanById(id);
    if (!existingPlan) {
      throw new ValidationError("Plan not found");
    }
    if (planData.name && planData.name !== existingPlan.name) {
      const planWithSameName = await planService.getPlanByName(planData.name);
      if (planWithSameName) {
        throw new ValidationError("Plan with this name already exists");
      }
    }
    const updatedPlan = await planService.updatePlan(id, planData);
    sendResponse(res, 200, true, "Plan updated successfully", { plan: updatedPlan });
  })
);

// DELETE /api/admin/plans/:id
adminPlansRouter.delete(
  "/:id",
  authenticateUser,
  validateParams(idParamSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (req.user?.role !== "SUPER_ADMIN") {
      throw new ValidationError("Insufficient permissions. Super admin access required.");
    }
    const { id } = req.params as IdParam;
    const existingPlan = await planService.getPlanById(id);
    if (!existingPlan) {
      throw new ValidationError("Plan not found");
    }
    await planService.deletePlan(id);
    sendResponse(res, 200, true, "Plan deleted successfully");
  })
);

export default orgPlansRouter;
