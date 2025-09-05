import Stripe from "stripe";
import { prisma } from "../lib/prisma";

const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
  // We don't throw on import so tests / non-payment envs still work; methods will throw if called.
  console.warn(
    "[payments] STRIPE_SECRET_KEY not set - payment endpoints disabled"
  );
}

export class PaymentService {
  stripe: Stripe | null;
  constructor() {
    this.stripe = stripeSecret
      ? new Stripe(stripeSecret, { apiVersion: "2024-06-20" })
      : null;
  }

  async createCheckoutSession(params: {
    organizationId: string;
    planId: string;
    baseUrl?: string;
  }) {
    if (!this.stripe) throw new Error("Stripe not configured");
    const plan = await prisma.plan.findUnique({ where: { id: params.planId } });
    if (!plan || !plan.isActive) throw new Error("Plan not found or inactive");

    // amount in cents (assuming price stored as Decimal dollars) -> convert
    const amountCents = Number(plan.price) * 100;
    if (!Number.isFinite(amountCents)) throw new Error("Invalid plan price");

    // Create pending payment record first (id used as internal reference)
    const payment = await prisma.payment.create({
      data: {
        organizationId: params.organizationId,
        planId: plan.id,
        amount: Math.round(amountCents),
        currency: "usd",
        status: "pending",
      },
    });

    const successUrl =
      process.env.FRONTEND_SUCCESS_URL ||
      `${
        params.baseUrl || "http://localhost:3000"
      }/dashboard/plans?status=success`;
    const cancelUrl =
      process.env.FRONTEND_CANCEL_URL ||
      `${
        params.baseUrl || "http://localhost:3000"
      }/dashboard/plans?status=cancelled`;

    const session = await this.stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      client_reference_id: payment.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amountCents),
            product_data: {
              name: plan.name,
              description: plan.description || undefined,
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        paymentId: payment.id,
        organizationId: params.organizationId,
        planId: plan.id,
        credits: String(plan.credits),
      },
    });

    // Store session id
    await prisma.payment.update({
      where: { id: payment.id },
      data: { stripeCheckoutSessionId: session.id },
    });

    return { checkoutUrl: session.url, paymentId: payment.id };
  }

  async fulfillPaymentFromSession(session: Stripe.Checkout.Session) {
    const paymentId = session.metadata?.paymentId;
    if (!paymentId) return; // nothing to do
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    if (!payment || payment.status === "succeeded") return; // already processed or missing

    const plan = await prisma.plan.findUnique({
      where: { id: payment.planId },
    });
    if (!plan) throw new Error("Plan missing during fulfillment");

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "succeeded" },
      }),
      prisma.organization.update({
        where: { id: payment.organizationId },
        data: { credits: { increment: plan.credits } },
      }),
      prisma.creditUsage.create({
        data: {
          organizationId: payment.organizationId,
          creditsUsed: -plan.credits, // negative indicates addition
          operation: "plan_purchase",
          metadata: {
            planId: plan.id,
            planName: plan.name,
            paymentId: payment.id,
            checkoutSessionId: session.id,
          },
        },
      }),
      prisma.billing.upsert({
        where: { organizationId: payment.organizationId },
        update: { planId: plan.id, subscriptionStatus: "ACTIVE" },
        create: {
          organizationId: payment.organizationId,
          planId: plan.id,
          subscriptionStatus: "ACTIVE",
        },
      }),
    ]);
  }
}

export const paymentService = new PaymentService();
