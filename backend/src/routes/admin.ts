import { Router, Request, Response, IRouter } from "express";
import { asyncHandler, sendResponse } from "../utils/helpers";
import { UserService } from "../services/userService";
import { ValidationError } from "../utils/errors";
import { CreateSuperAdminInput } from "../types";
import { User } from "@prisma/client";

const router: IRouter = Router();
const userService = new UserService();

// POST /api/admin/super-admin
// Creates the initial super admin - can only be called once
router.post(
  "/super-admin",
  asyncHandler(async (req: Request, res: Response) => {
    const { email, name } = req.body as CreateSuperAdminInput;

    // Basic validation
    if (!email || !name) {
      throw new ValidationError("Email and name are required");
    }

    if (!email.includes("@")) {
      throw new ValidationError("Please provide a valid email address");
    }

    if (name.length < 2) {
      throw new ValidationError("Name must be at least 2 characters long");
    }

    // Check if super admin already exists
    const superAdminExists = await userService.checkSuperAdminExists();
    if (superAdminExists) {
      throw new ValidationError(
        "Super admin already exists. Only one super admin can be created."
      );
    }

    // Create the super admin
    const superAdmin = await userService.createSuperAdmin({
      email,
      name,
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

export default router;
