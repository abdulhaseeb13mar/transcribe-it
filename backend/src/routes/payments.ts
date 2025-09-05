import { Router, Response, IRouter, Request } from "express";
import {
  authenticateUser,
  AuthenticatedRequest,
} from "../middleware/supabaseAuth";
import { asyncHandler, sendResponse } from "../utils/helpers";
import { ValidationError } from "../utils/errors";
import { UserService } from "../services/userService";
import { paymentService } from "../services/paymentService";
import Stripe from "stripe";
import { prisma } from "../lib/prisma";

const router: IRouter = Router();
const userService = new UserService();

// POST /api/payments/checkout { planId }
router.post(
  "/checkout",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { planId } = req.body || {};

    if (!planId) throw new ValidationError("'planId' is required");
    const email = req.user?.email;
    if (!email) throw new ValidationError("Authenticated user email not found");
    const user = await userService.findUserByEmail(email);
    if (!user || !user.organizationId)
      throw new ValidationError("User not in organization");
    if (user.role !== "ADMIN")
      throw new ValidationError(
        "Only organization admins can purchase credits"
      );

    const { checkoutUrl, paymentId } =
      await paymentService.createCheckoutSession({
        organizationId: user.organizationId,
        planId,
        baseUrl: process.env.CORS_ORIGIN,
      });
    sendResponse(res, 200, true, "Checkout session created", {
      checkoutUrl,
      paymentId,
    });
  })
);

// GET /api/payments/organization/:organizationId -> list payments for org
router.get(
  "/organization/:organizationId",
  authenticateUser,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { organizationId } = req.params;
    if (!organizationId)
      throw new ValidationError("'organizationId' param is required");

    // Ensure requesting user belongs to the organization
    const email = req.user?.email;
    if (!email) throw new ValidationError("Authenticated user email not found");
    const user = await userService.findUserByEmail(email);
    if (!user || !user.organizationId)
      throw new ValidationError("User not in organization");
    if (user.organizationId !== organizationId) {
      throw new ValidationError(
        "Not authorized to view payments for this organization"
      );
    }

    const page = Number((req.query.page as string) ?? 1) || 1;
    const pageSize =
      Number((req.query.limit as string) ?? req.query.pageSize ?? 20) || 20;
    const result = await paymentService.getPaymentsByOrganization(
      organizationId,
      { page, pageSize }
    );
    sendResponse(res, 200, true, "Payments fetched", {
      payments: result.items,
      count: result.items.length,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  })
);

// Stripe webhook (raw body required) -> configure in index before json parser if needed
router.post("/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"] as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res
      .status(400)
      .json({ success: false, message: "Webhook secret not configured" });
  }
  let event: Stripe.Event;
  try {
    const stripe = paymentService.stripe;
    if (!stripe) throw new Error("Stripe not configured");
    const payload = (req as any).rawBody
      ? (req as any).rawBody
      : JSON.stringify(req.body);
    event = stripe.webhooks.constructEvent(payload, sig || "", webhookSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await paymentService.fulfillPaymentFromSession(session);
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const paymentId = session.metadata?.paymentId;
        if (paymentId) {
          await prisma.payment
            .update({ where: { id: paymentId }, data: { status: "expired" } })
            .catch(() => {});
        }
        break;
      }
      default:
        break;
    }
    return res.json({ received: true });
  } catch (e: any) {
    console.error("Webhook handling failed", e);
    return res.status(500).json({ success: false, message: e.message });
  }
});

export default router;
