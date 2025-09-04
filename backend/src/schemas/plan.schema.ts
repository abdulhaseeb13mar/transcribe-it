import { z } from "zod";
import { PlanType } from "@prisma/client";

// Create plan input schema
export const createPlanSchema = z.object({
  name: z
    .string()
    .min(1, "Plan name is required")
    .max(100, "Plan name must be less than 100 characters"),
  type: z.nativeEnum(PlanType, {
    message: "Plan type must be BASIC or PREMIUM",
  }),
  credits: z
    .number()
    .int("Credits must be an integer")
    .min(0, "Credits cannot be negative"),
  price: z
    .number()
    .min(0, "Price cannot be negative")
    .refine(
      (val) => Number((val * 100).toFixed(0)) / 100 === val,
      "Price can have at most 2 decimal places"
    ),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  isActive: z.boolean().optional().default(true),
});

// Update plan input schema
export const updatePlanSchema = createPlanSchema.partial();

// Plan query parameters schema
export const planQuerySchema = z.object({
  type: z.nativeEnum(PlanType).optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => val === "true")
    .pipe(z.boolean()),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, "Page must be a positive number"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100"),
  sort: z
    .string()
    .optional()
    .refine(
      (val) => !val || ["asc", "desc"].includes(val),
      "Sort must be 'asc' or 'desc'"
    )
    .default("asc"),
  sortBy: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        ["name", "type", "credits", "price", "createdAt", "updatedAt"].includes(
          val
        ),
      "Invalid sort field"
    )
    .default("createdAt"),
});

// Type exports
export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type PlanQueryParams = z.infer<typeof planQuerySchema>;
