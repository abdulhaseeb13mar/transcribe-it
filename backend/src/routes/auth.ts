import { Router, Request, Response, IRouter } from "express";
import {
  asyncHandler,
  sendResponse,
  sendErrorResponse,
} from "../utils/helpers";
import { ValidationError } from "../utils/errors";
import { supabase } from "../config/supabase";
import {
  authenticateUser,
  AuthenticatedRequest,
} from "../middleware/supabaseAuth";
import { UserService } from "../services/userService";
import { UserRole } from "@prisma/client";
import { validateBody, ValidatedRequest } from "../middleware/validation";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../schemas/auth.schema";

const router: IRouter = Router();
const userService = new UserService();

// POST /api/auth/register
router.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = (req as any)
      .validatedBody as RegisterInput;

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
      },
    });

    if (authError) {
      throw new ValidationError(`Registration failed: ${authError.message}`);
    }

    // Create user profile in users table using Prisma
    if (authData.user) {
      try {
        await userService.createUser({
          email: authData.user.email || email,
          name: name,
          role: UserRole.ADMIN, // Default role for regular users
          organizationId: null, // Will be set when user joins/creates organization
        });
      } catch (profileError: any) {
        console.error("Profile creation error:", profileError);
        // Continue even if profile creation fails
      }
    }

    sendResponse(
      res,
      201,
      true,
      "User registered successfully. Please check your email for verification.",
      {
        user: {
          id: authData.user?.id,
          email: authData.user?.email,
          name: name,
        },
        needsEmailVerification: !authData.user?.email_confirmed_at,
      }
    );
  })
);

// POST /api/auth/login
router.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = (req as any).validatedBody as LoginInput;

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new ValidationError(`Login failed: ${error.message}`);
    }

    // Get user profile from users table using Prisma
    const userProfile = await userService.findUserById(data.user.id);

    sendResponse(res, 200, true, "Login successful", {
      user: {
        id: data.user.id,
        email: data.user.email,
        name: userProfile?.name || data.user.user_metadata?.name,
      },
      token: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      expiresAt: data.session?.expires_at,
    });
  })
);

// POST /api/auth/logout
router.post(
  "/logout",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // Get token from header
    const token = req.headers.authorization?.substring(7);

    if (token) {
      // Sign out with Supabase
      await supabase.auth.signOut();
    }

    sendResponse(res, 200, true, "Logout successful");
  })
);

// GET /api/auth/me
router.get(
  "/me",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new ValidationError("User not found");
    }

    // Get user profile from users table using Prisma
    const userProfile = await userService.findUserById(userId);

    if (!userProfile) {
      throw new ValidationError("User profile not found");
    }

    sendResponse(res, 200, true, "User info retrieved", {
      user: {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt,
      },
    });
  })
);

// POST /api/auth/refresh
router.post(
  "/refresh",
  validateBody(refreshTokenSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = (req as any).validatedBody as RefreshTokenInput;

    // Refresh the session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new ValidationError(`Token refresh failed: ${error.message}`);
    }

    sendResponse(res, 200, true, "Token refreshed successfully", {
      token: data.session?.access_token,
      refreshToken: data.session?.refresh_token,
      expiresAt: data.session?.expires_at,
    });
  })
);

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  validateBody(forgotPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = (req as any).validatedBody as ForgotPasswordInput;

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.CORS_ORIGIN}/reset-password`,
    });

    if (error) {
      throw new ValidationError(`Password reset failed: ${error.message}`);
    }

    sendResponse(res, 200, true, "Password reset email sent successfully");
  })
);

// POST /api/auth/reset-password
router.post(
  "/reset-password",
  validateBody(resetPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = (req as any)
      .validatedBody as ResetPasswordInput;

    // Update password with the reset token
    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      throw new ValidationError(`Password reset failed: ${error.message}`);
    }

    sendResponse(res, 200, true, "Password reset successfully");
  })
);

export default router;
