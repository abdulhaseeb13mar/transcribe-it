import { Router, Request, Response, IRouter } from "express";
import { asyncHandler, sendResponse } from "../utils/helpers";
import { UserService } from "../services/userService";
import { OrganizationService } from "../services/organizationService";
import { ValidationError } from "../utils/errors";
import { supabaseAdmin } from "../config/supabase"; // Updated to use admin client
import { validateBody } from "../middleware/validation";
import { authenticate } from "../middleware/auth";
import {
  createSuperAdminSchema,
  CreateSuperAdminInput,
} from "../schemas/admin.schema";

const router: IRouter = Router();
const userService = new UserService();
const organizationService = new OrganizationService();

// POST /api/admin/super-admin
// Creates the initial super admin - can only be called once
router.post(
  "/super-admin",
  validateBody(createSuperAdminSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name, password } = (req as any)
      .validatedBody as CreateSuperAdminInput;

    // Check if super admin already exists
    const superAdminExists = await userService.checkSuperAdminExists();
    if (superAdminExists) {
      throw new ValidationError(
        "Super admin already exists. Only one super admin can be created."
      );
    }

    // Create Supabase auth user first
    const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser(
      {
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          name,
          role: "SUPER_ADMIN",
        },
      }
    );

    if (error) {
      throw new ValidationError(`Failed to create auth user: ${error.message}`);
    }

    try {
      // Create the super admin in your database
      const superAdmin = await userService.createSuperAdmin({
        email,
        name,
        password,
      });

      sendResponse(res, 201, true, "Super admin created successfully", {
        superAdmin: {
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: superAdmin.role,
          createdAt: superAdmin.createdAt,
        },
      });
    } catch (dbError) {
      // Rollback: delete the Supabase user if database creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      throw dbError;
    }
  })
);

// GET /api/admin/super-admin/check
// Checks if a super admin already exists
router.get(
  "/super-admin/check",
  asyncHandler(async (req: Request, res: Response) => {
    const exists = await userService.checkSuperAdminExists();

    sendResponse(res, 200, true, "Super admin existence check completed", {
      exists,
      message: exists
        ? "Super admin already exists"
        : "No super admin found - one can be created",
    });
  })
);

// GET /api/admin/get-organizations
// Fetches all organizations - requires admin authentication
router.get(
  "/get-organizations",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const organizations = await organizationService.getAllOrganizations();

    sendResponse(res, 200, true, "Organizations retrieved successfully", {
      organizations,
      count: organizations.length,
    });
  })
);

export default router;
