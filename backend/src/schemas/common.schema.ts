import { z } from "zod";

// Common validation schemas for query parameters and route parameters

// Pagination schema for query parameters
export const paginationSchema = z.object({
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
    ),
  sortBy: z.string().optional(),
});

// ID parameter schema for route parameters
export const idParamSchema = z.object({
  id: z.string().uuid("Invalid UUID format").min(1, "ID is required"),
});

// Search query schema
export const searchQuerySchema = z.object({
  q: z
    .string()
    .min(1, "Search query is required")
    .max(255, "Search query must be less than 255 characters"),
  ...paginationSchema.shape,
});

// Type exports
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
export type SearchQuery = z.infer<typeof searchQuerySchema>;
