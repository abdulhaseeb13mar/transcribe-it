import { z } from "zod";

// Create super admin schema
export const createSuperAdminSchema = z.object({
  email: z
    .string()
    .email("Invalid email format")
    .min(1, "Email is required")
    .max(255, "Email must be less than 255 characters"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name must be less than 100 characters")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Name can only contain letters, spaces, hyphens, and apostrophes"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

// Create organization schema
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(2, "Organization name must be at least 2 characters long")
    .max(100, "Organization name must be less than 100 characters")
    .regex(
      /^[a-zA-Z0-9\s'-]+$/,
      "Organization name can only contain letters, numbers, spaces, hyphens, and apostrophes"
    ),
  adminName: z
    .string()
    .min(2, "Admin name must be at least 2 characters long")
    .max(100, "Admin name must be less than 100 characters")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Admin name can only contain letters, spaces, hyphens, and apostrophes"
    ),
  adminEmail: z
    .string()
    .email("Invalid admin email format")
    .min(1, "Admin email is required")
    .max(255, "Admin email must be less than 255 characters"),
  adminPassword: z
    .string()
    .min(8, "Admin password must be at least 8 characters long")
    .max(100, "Admin password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Admin password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  credits: z
    .number()
    .int("Credits must be an integer")
    .min(0, "Credits must be a non-negative number")
    .max(1000000, "Credits cannot exceed 1,000,000")
    .optional()
    .default(1000),
});

// Type exports
export type CreateSuperAdminInput = z.infer<typeof createSuperAdminSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
