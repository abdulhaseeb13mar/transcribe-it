import { Router, Request, Response, IRouter } from "express";
import { asyncHandler, sendResponse } from "../utils/helpers";
import {
  authenticateUser,
  AuthenticatedRequest,
} from "../middleware/supabaseAuth";
import { UserService } from "../services/userService";
import { TranscriptionService } from "../services/transcriptionService";
import { ValidationError } from "../utils/errors";

const router: IRouter = Router();
const userService = new UserService();
const transcriptionService = new TranscriptionService();

// GET /api/users/profile
router.get(
  "/profile",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError("User not authenticated");
    }

    const user = await userService.findUserById(userId);

    if (!user) {
      throw new ValidationError("User not found");
    }

    sendResponse(res, 200, true, "Profile retrieved successfully", {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  })
);

// PUT /api/users/profile
router.put(
  "/profile",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, email } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError("User not authenticated");
    }

    // Validate input
    if (!name && !email) {
      throw new ValidationError(
        "At least one field (name or email) is required"
      );
    }

    // Update user profile
    const updatedUser = await userService.updateUser(userId, {
      ...(name && { name }),
      ...(email && { email }),
    });

    if (!updatedUser) {
      throw new ValidationError("Failed to update user profile");
    }

    sendResponse(res, 200, true, "Profile updated successfully", {
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        updatedAt: updatedUser.updatedAt,
      },
    });
  })
);

// DELETE /api/users/account
router.delete(
  "/account",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError("User not authenticated");
    }

    // Delete user account
    const deleted = await userService.deleteUser(userId);

    if (!deleted) {
      throw new ValidationError("Failed to delete user account");
    }

    sendResponse(res, 200, true, "Account deleted successfully");
  })
);

// GET /api/users/transcriptions
router.get(
  "/transcriptions",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError("User not authenticated");
    }

    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get user transcriptions
    const { transcriptions, total } =
      await transcriptionService.findTranscriptionsByUserId(
        userId,
        page,
        limit
      );

    sendResponse(res, 200, true, "Transcriptions retrieved successfully", {
      transcriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

export default router;
