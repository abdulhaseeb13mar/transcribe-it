import { Router, Response, IRouter } from "express";
import { asyncHandler, sendResponse } from "../utils/helpers";
import { authenticateUser, AuthenticatedRequest } from "../middleware/supabaseAuth";
import { ValidationError } from "../utils/errors";
import { prisma } from "../lib/prisma";
import { UserService } from "../services/userService";

const router: IRouter = Router();
const userService = new UserService();

// GET /api/credits/me - returns the authenticated user's organization's credit balance
router.get(
  "/me",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const email = req.user?.email;
    if (!email) {
      throw new ValidationError("Authenticated user email not found");
    }

    const user = await userService.findUserByEmail(email);
    if (!user || !user.organizationId) {
      throw new ValidationError("User is not associated with any organization");
    }

    const organization = await prisma.organization.findUnique({
      where: { id: user.organizationId },
      select: { id: true, name: true, credits: true },
    });
    if (!organization) {
      throw new ValidationError("Organization not found");
    }

    // Return last 10 usage items as optional history for UI
    const recentUsage = await prisma.creditUsage.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        creditsUsed: true,
        operation: true,
        metadata: true,
        createdAt: true,
      },
    });

    sendResponse(res, 200, true, "Credit balance fetched", {
      organization: {
        id: organization.id,
        name: organization.name,
      },
      credits: organization.credits,
      recentUsage,
    });
  })
);

export default router;

