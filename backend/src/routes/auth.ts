import { Router, Request, Response, IRouter } from "express";
import { asyncHandler, sendResponse } from "../utils/helpers";
import { ValidationError } from "../utils/errors";
import { supabase } from "../config/supabase";
import {
  authenticateUser,
  AuthenticatedRequest,
} from "../middleware/supabaseAuth";
import { UserService } from "../services/userService";
import { OrganizationService } from "../services/organizationService";
import { UserRole } from "@prisma/client";
import { validateBody } from "../middleware/validation";
import {
  registerSchema,
  registerOrgSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  RegisterInput,
  RegisterOrgInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "../schemas/auth.schema";

const router: IRouter = Router();
const userService = new UserService();
const organizationService = new OrganizationService();

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
        // emailRedirectTo: "http://localhost:5173",
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

// POST /api/auth/register-org
router.post(
  "/register-org",
  validateBody(registerOrgSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name, orgName } = (req as any)
      .validatedBody as RegisterOrgInput;

    // Check if organization name already exists
    const existingOrg = await organizationService.findOrganizationByName(
      orgName
    );
    if (existingOrg) {
      throw new ValidationError("Organization with this name already exists");
    }

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name,
        },
        // emailRedirectTo: "http://localhost:5173",
      },
    });

    if (authError) {
      throw new ValidationError(`Registration failed: ${authError.message}`);
    }

    if (authData.user) {
      try {
        // Create organization first
        const organization = await organizationService.createOrganization({
          name: orgName,
          credits: 0, // Default credits for new organizations
        });

        // Create user profile with organization and ADMIN role
        const userProfile = await userService.createUser({
          email: authData.user.email || email,
          name: name,
          role: UserRole.ADMIN, // Admin role for organization creator
          organizationId: organization.id,
        });

        sendResponse(
          res,
          201,
          true,
          "Organization and admin user registered successfully. Please check your email for verification.",
          {
            user: {
              id: authData.user.id,
              email: authData.user.email,
              name: name,
              role: userProfile.role,
            },
            organization: {
              id: organization.id,
              name: organization.name,
              credits: organization.credits,
            },
            needsEmailVerification: !authData.user?.email_confirmed_at,
          }
        );
      } catch (error: any) {
        console.error("Organization/profile creation error:", error);

        // If organization or user creation fails after Supabase registration,
        // we should clean up the Supabase user to maintain consistency
        try {
          await supabase.auth.admin.deleteUser(authData.user.id);
        } catch (cleanupError) {
          console.error("Failed to cleanup Supabase user:", cleanupError);
        }

        throw new ValidationError(`Registration failed: ${error.message}`);
      }
    } else {
      throw new ValidationError("Failed to create user account");
    }
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
    // const userId = req.user?.id;
    const userEmail = req.user?.email;

    if (!userEmail) {
      throw new ValidationError("User not found");
    }

    // Get user profile from users table using Prisma
    const userProfile = await userService.findUserByEmail(userEmail);

    if (!userProfile) {
      throw new ValidationError("User profile not found");
    }

    sendResponse(res, 200, true, "User info retrieved", {
      user: userProfile,
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

// GET /api/auth/confirm - Handle email confirmation redirect from Supabase
router.get(
  "/confirm",
  asyncHandler(async (req: Request, res: Response) => {
    const { access_token, refresh_token, type, error, error_description } =
      req.query;

    // Handle error case
    if (error) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const errorMsg =
        (error_description as string) || (error as string) || "Unknown error";
      return res.redirect(
        `${frontendUrl}/auth/confirm?error=${encodeURIComponent(errorMsg)}`
      );
    }

    // Handle successful confirmation
    if (type === "signup" && access_token && refresh_token) {
      try {
        // Set the session with the tokens from the URL
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: access_token as string,
          refresh_token: refresh_token as string,
        });
        console.log("Session set successfully:", data);

        if (sessionError) {
          const frontendUrl =
            process.env.FRONTEND_URL || "http://localhost:3000";
          return res.redirect(
            `${frontendUrl}/auth/confirm?error=${encodeURIComponent(
              sessionError.message
            )}`
          );
        }

        if (data.user) {
          // User email is now confirmed in Supabase
          // Optionally update user profile in your database if needed
          try {
            const userProfile = await userService.findUserById(data.user.id);
            if (!userProfile) {
              // Create user profile if it doesn't exist
              await userService.createUser({
                email: data.user.email || "",
                name: data.user.user_metadata?.name || "User",
                role: UserRole.ADMIN,
                organizationId: null,
              });
            }
          } catch (profileError) {
            console.error("Error updating user profile:", profileError);
            // Continue even if profile update fails
          }

          // Redirect to frontend with success and tokens
          const frontendUrl =
            process.env.FRONTEND_URL || "http://localhost:3000";
          return res.redirect(
            `${frontendUrl}/auth/confirm?confirmed=true&access_token=${access_token}&refresh_token=${refresh_token}`
          );
        }
      } catch (confirmError) {
        console.error("Confirmation error:", confirmError);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        return res.redirect(
          `${frontendUrl}/auth/confirm?error=${encodeURIComponent(
            "Confirmation failed"
          )}`
        );
      }
    }

    // Fallback redirect for invalid or missing parameters
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(
      `${frontendUrl}/auth/confirm?error=${encodeURIComponent(
        "Invalid confirmation link"
      )}`
    );
  })
);

// POST /api/auth/confirm-email - Manual email confirmation with tokens
router.post(
  "/confirm-email",
  asyncHandler(async (req: Request, res: Response) => {
    const { access_token, refresh_token } = req.body;

    if (!access_token || !refresh_token) {
      throw new ValidationError("Access token and refresh token are required");
    }

    try {
      // Set the session with the provided tokens
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        throw new ValidationError(
          `Email confirmation failed: ${error.message}`
        );
      }

      if (data.user) {
        // Check if user profile exists, create if not
        let userProfile = await userService.findUserById(data.user.id);

        if (!userProfile) {
          userProfile = await userService.createUser({
            email: data.user.email || "",
            name: data.user.user_metadata?.name || "User",
            role: UserRole.ADMIN,
            organizationId: null,
          });
        }

        sendResponse(res, 200, true, "Email confirmed successfully", {
          user: {
            id: data.user.id,
            email: data.user.email,
            name: userProfile.name,
            emailConfirmed: data.user.email_confirmed_at !== null,
          },
          session: {
            access_token: data.session?.access_token,
            refresh_token: data.session?.refresh_token,
            expires_at: data.session?.expires_at,
          },
        });
      } else {
        throw new ValidationError("Invalid session data");
      }
    } catch (error: any) {
      throw new ValidationError(`Email confirmation failed: ${error.message}`);
    }
  })
);

export default router;
