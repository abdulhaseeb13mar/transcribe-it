import { z } from "zod";

// Update user profile schema
export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters long")
      .max(100, "Name must be less than 100 characters")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "Name can only contain letters, spaces, hyphens, and apostrophes"
      )
      .optional(),
    email: z
      .string()
      .email("Invalid email format")
      .max(255, "Email must be less than 255 characters")
      .optional(),
  })
  .refine((data) => data.name || data.email, {
    message: "At least one field (name or email) must be provided",
    path: ["name"],
  });

// Type exports
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
