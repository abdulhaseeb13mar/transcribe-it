import { prisma } from "../lib/prisma";
import { Plan, Prisma } from "@prisma/client";
import {
  CreatePlanInput,
  UpdatePlanInput,
  PlanQueryParams,
} from "../schemas/plan.schema";
import { PaginationInfo } from "../types";

export class PlanService {
  /**
   * Get all plans with optional filtering and pagination
   */
  async getPlans(params: PlanQueryParams): Promise<{
    plans: Plan[];
    pagination: PaginationInfo;
  }> {
    try {
      // Set default values for pagination parameters
      const page = params.page ?? 1;
      const limit = params.limit ?? 10;
      const sort = params.sort ?? "asc";
      const sortBy = params.sortBy ?? "createdAt";
      const { type, isActive } = params;

      // Build where clause
      const where: Prisma.PlanWhereInput = {};

      if (type !== undefined) {
        where.type = type;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      // Build orderBy clause
      const orderBy: Prisma.PlanOrderByWithRelationInput = {
        [sortBy]: sort,
      };

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get total count for pagination
      const total = await prisma.plan.count({ where });
      // Get plans with pagination
      const plans = await prisma.plan.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);

      return {
        plans,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch plans: ${error.message}`);
    }
  }

  /**
   * Get a single plan by ID
   */
  async getPlanById(id: string): Promise<Plan | null> {
    try {
      const plan = await prisma.plan.findUnique({
        where: { id },
      });

      return plan;
    } catch (error: any) {
      throw new Error(`Failed to find plan: ${error.message}`);
    }
  }

  /**
   * Get a plan by name
   */
  async getPlanByName(name: string): Promise<Plan | null> {
    try {
      const plan = await prisma.plan.findUnique({
        where: { name },
      });

      return plan;
    } catch (error: any) {
      throw new Error(`Failed to find plan: ${error.message}`);
    }
  }

  /**
   * Create a new plan
   */
  async createPlan(planData: CreatePlanInput): Promise<Plan> {
    try {
      const plan = await prisma.plan.create({
        data: {
          name: planData.name,
          type: planData.type,
          credits: planData.credits,
          price: planData.price,
          description: planData.description || null,
          isActive: planData.isActive ?? true,
        },
      });

      return plan;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new Error("Plan with this name already exists");
      }
      throw new Error(`Failed to create plan: ${error.message}`);
    }
  }

  /**
   * Update an existing plan
   */
  async updatePlan(id: string, planData: UpdatePlanInput): Promise<Plan> {
    try {
      const plan = await prisma.plan.update({
        where: { id },
        data: {
          ...(planData.name && { name: planData.name }),
          ...(planData.type && { type: planData.type }),
          ...(planData.credits !== undefined && { credits: planData.credits }),
          ...(planData.price !== undefined && { price: planData.price }),
          ...(planData.description !== undefined && {
            description: planData.description,
          }),
          ...(planData.isActive !== undefined && {
            isActive: planData.isActive,
          }),
        },
      });

      return plan;
    } catch (error: any) {
      if (error.code === "P2002") {
        throw new Error("Plan with this name already exists");
      }
      if (error.code === "P2025") {
        throw new Error("Plan not found");
      }
      throw new Error(`Failed to update plan: ${error.message}`);
    }
  }

  /**
   * Delete a plan
   */
  async deletePlan(id: string): Promise<void> {
    try {
      await prisma.plan.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === "P2025") {
        throw new Error("Plan not found");
      }
      if (error.code === "P2003") {
        throw new Error(
          "Cannot delete plan as it is referenced by billing records"
        );
      }
      throw new Error(`Failed to delete plan: ${error.message}`);
    }
  }

  /**
   * Get active plans only
   */
  async getActivePlans(): Promise<Plan[]> {
    try {
      const plans = await prisma.plan.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      });

      return plans;
    } catch (error: any) {
      throw new Error(`Failed to fetch active plans: ${error.message}`);
    }
  }
}
