import { Router, Request, Response, IRouter } from "express";
import { asyncHandler, sendResponse } from "../utils/helpers";
import {
  authenticateUser,
  AuthenticatedRequest,
} from "../middleware/supabaseAuth";
import { PlanService } from "../services/planService";
import { ValidationError } from "../utils/errors";
import {
  validateBody,
  validateQuery,
  validateParams,
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

const router: IRouter = Router();
const planService = new PlanService();

/**
 * GET /api/plans
 * Get all plans with optional filtering and pagination
 * Query params: type, isActive, page, limit, sort, sortBy
 */
router.get(
  "/",
  validateQuery(planQuerySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const queryParams = req.query as unknown as PlanQueryParams;

    const { plans, pagination } = await planService.getPlans(queryParams);

    sendResponse(res, 200, true, "Plans retrieved successfully", {
      plans,
      pagination,
    });
  })
);

/**
 * GET /api/plans/active
 * Get all active plans
 */
router.get(
  "/active",
  asyncHandler(async (req: Request, res: Response) => {
    const plans = await planService.getActivePlans();

    sendResponse(res, 200, true, "Active plans retrieved successfully", {
      plans,
    });
  })
);

/**
 * GET /api/plans/:id
 * Get a single plan by ID
 */
router.get(
  "/:id",
  validateParams(idParamSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as IdParam;

    const plan = await planService.getPlanById(id);

    if (!plan) {
      throw new ValidationError("Plan not found");
    }

    sendResponse(res, 200, true, "Plan retrieved successfully", {
      plan,
    });
  })
);

/**
 * POST /api/plans
 * Create a new plan
 * Requires authentication and super admin role
 */
router.post(
  "/",
  authenticateUser,
  validateBody(createPlanSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const planData = req.body as CreatePlanInput;

    // Check if plan name already exists
    const existingPlan = await planService.getPlanByName(planData.name);
    if (existingPlan) {
      throw new ValidationError("Plan with this name already exists");
    }

    const plan = await planService.createPlan(planData);

    sendResponse(res, 201, true, "Plan created successfully", {
      plan,
    });
  })
);

/**
 * PUT /api/plans/:id
 * Update an existing plan
 * Requires authentication and super admin role
 */
router.put(
  "/:id",
  authenticateUser,
  validateParams(idParamSchema),
  validateBody(updatePlanSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if user is super admin
    if (req.user?.role !== "SUPER_ADMIN") {
      throw new ValidationError(
        "Insufficient permissions. Super admin access required."
      );
    }

    const { id } = req.params as IdParam;
    const planData = req.body as UpdatePlanInput;

    // Check if plan exists
    const existingPlan = await planService.getPlanById(id);
    if (!existingPlan) {
      throw new ValidationError("Plan not found");
    }

    // Check if name is being updated and if it conflicts with existing plan
    if (planData.name && planData.name !== existingPlan.name) {
      const planWithSameName = await planService.getPlanByName(planData.name);
      if (planWithSameName) {
        throw new ValidationError("Plan with this name already exists");
      }
    }

    const updatedPlan = await planService.updatePlan(id, planData);

    sendResponse(res, 200, true, "Plan updated successfully", {
      plan: updatedPlan,
    });
  })
);

/**
 * DELETE /api/plans/:id
 * Delete a plan
 * Requires authentication and super admin role
 */
router.delete(
  "/:id",
  authenticateUser,
  validateParams(idParamSchema),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Check if user is super admin
    if (req.user?.role !== "SUPER_ADMIN") {
      throw new ValidationError(
        "Insufficient permissions. Super admin access required."
      );
    }

    const { id } = req.params as IdParam;

    // Check if plan exists
    const existingPlan = await planService.getPlanById(id);
    if (!existingPlan) {
      throw new ValidationError("Plan not found");
    }

    await planService.deletePlan(id);

    sendResponse(res, 200, true, "Plan deleted successfully");
  })
);

export default router;
