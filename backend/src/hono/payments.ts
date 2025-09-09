import { Hono } from "hono";
import type { Env } from "../worker-env";
import { withSupabaseAuth, getUser } from "./auth";
import { createPrisma } from "../lib/prisma-edge";

type App = Hono<{ Bindings: Env }>;

export const registerPaymentRoutes = (app: App) => {
  // POST /api/payments/checkout — create Stripe Checkout Session and a pending payment record
  app.post("/api/payments/checkout", withSupabaseAuth(), async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const planId = body?.planId as string | undefined;
    if (!planId) return c.json({ success: false, message: "'planId' is required" }, 400);

    const u = getUser(c);
    if (!u?.email) return c.json({ success: false, message: "Authenticated user email not found" }, 400);

    const prisma = createPrisma(c.env);
    try {
      const user = await prisma.user.findUnique({ where: { email: u.email } });
      if (!user || !user.organizationId) return c.json({ success: false, message: "User not in organization" }, 400);

      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan || !plan.isActive) return c.json({ success: false, message: "Plan not found or inactive" }, 404);

      const amountCents = Math.round(Number(plan.price) * 100);
      if (!Number.isFinite(amountCents)) return c.json({ success: false, message: "Invalid plan price" }, 400);

      // Create pending payment
      const payment = await prisma.payment.create({
        data: {
          organizationId: user.organizationId,
          planId: plan.id,
          amount: amountCents,
          currency: "usd",
          status: "pending",
        },
      });

      const stripeKey = c.env.STRIPE_SECRET_KEY;
      if (!stripeKey) return c.json({ success: false, message: "Stripe not configured" }, 500);

      const baseUrl = c.env.CORS_ORIGIN || "http://localhost:3000";
      const successUrl = `${baseUrl}${c.env.FRONTEND_SUCCESS_URL || "/dashboard/payment-success"}`;
      const cancelUrl = `${baseUrl}${c.env.FRONTEND_CANCEL_URL || "/dashboard/payment-cancel"}`;

      const form = new URLSearchParams();
      form.set("mode", "payment");
      form.append("payment_method_types[]", "card");
      form.set("client_reference_id", payment.id);
      form.append("line_items[0][quantity]", "1");
      form.set("line_items[0][price_data][currency]", "usd");
      form.set("line_items[0][price_data][unit_amount]", String(amountCents));
      form.set("line_items[0][price_data][product_data][name]", plan.name);
      if (plan.description) form.set("line_items[0][price_data][product_data][description]", plan.description);
      form.set("success_url", successUrl);
      form.set("cancel_url", cancelUrl);
      form.set("metadata[paymentId]", payment.id);
      form.set("metadata[organizationId]", user.organizationId);
      form.set("metadata[planId]", plan.id);
      form.set("metadata[credits]", String(plan.credits));

      const resp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form.toString(),
      });
      const data = await resp.json<any>();
      if (!resp.ok) {
        console.log(`[STRIPE] error status=${resp.status} body=${JSON.stringify(data)}`);
        return c.json({ success: false, message: `Stripe error: ${data.error?.message || resp.statusText}` }, 400);
      }

      await prisma.payment.update({ where: { id: payment.id }, data: { stripeCheckoutSessionId: data.id } });
      return c.json({ success: true, message: "Checkout session created", data: { checkoutUrl: data.url, paymentId: payment.id } });
    } finally {
      await prisma.$disconnect();
    }
  });

  // GET /api/payments/organization/:id — list payments for org (paginated)
  app.get("/api/payments/organization/:organizationId", withSupabaseAuth(), async (c) => {
    const organizationId = c.req.param("organizationId");
    const page = Number(c.req.query("page") ?? 1) || 1;
    const pageSize = Number(c.req.query("limit") ?? c.req.query("pageSize") ?? 20) || 20;
    const prisma = createPrisma(c.env);
    try {
      const where = { organizationId } as const;
      const [total, items] = await Promise.all([
        prisma.payment.count({ where }),
        prisma.payment.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: { plan: { select: { id: true, name: true, credits: true, price: true } } },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);
      return c.json({ success: true, message: "Payments fetched", data: { payments: items, count: items.length, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 } });
    } finally {
      await prisma.$disconnect();
    }
  });

  // Admin: GET /api/admin/get-payments — list all payments
  app.get("/api/admin/get-payments", withSupabaseAuth(), async (c) => {
    // Optional: check role from token metadata; real enforcement could query DB
    const page = Number(c.req.query("page") ?? 1) || 1;
    const pageSize = Number(c.req.query("limit") ?? c.req.query("pageSize") ?? 20) || 20;
    const prisma = createPrisma(c.env);
    try {
      const [total, items] = await Promise.all([
        prisma.payment.count(),
        prisma.payment.findMany({
          orderBy: { createdAt: "desc" },
          include: { plan: { select: { id: true, name: true, credits: true, price: true } }, organization: { select: { id: true, name: true } } },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);
      return c.json({ success: true, message: "Payments fetched", data: { payments: items, count: items.length, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 } });
    } finally {
      await prisma.$disconnect();
    }
  });

  // POST /api/payments/webhook — Stripe webhook handler with signature verification
  app.post("/api/payments/webhook", async (c) => {
    const sig = c.req.header("stripe-signature") || c.req.header("Stripe-Signature");
    const secret = c.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) return c.json({ success: false, message: "Webhook secret not configured" }, 400);
    if (!sig) return c.json({ success: false, message: "Missing Stripe-Signature header" }, 400);

    const payload = await c.req.text();
    const ok = await verifyStripeSignature(payload, sig, secret);
    if (!ok) return c.json({ success: false, message: "Invalid signature" }, 400);

    let event: any;
    try {
      event = JSON.parse(payload);
    } catch (e) {
      return c.json({ success: false, message: "Invalid JSON payload" }, 400);
    }

    const prisma = createPrisma(c.env);
    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as any;
          const paymentId = session?.metadata?.paymentId;
          if (!paymentId) break;
          const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
          if (!payment || payment.status === "succeeded") break;
          const plan = await prisma.plan.findUnique({ where: { id: payment.planId } });
          if (!plan) break;
          await prisma.$transaction([
            prisma.payment.update({ where: { id: payment.id }, data: { status: "succeeded" } }),
            prisma.organization.update({ where: { id: payment.organizationId }, data: { credits: { increment: plan.credits } } }),
            prisma.creditUsage.create({
              data: {
                organizationId: payment.organizationId,
                creditsUsed: -plan.credits,
                operation: "plan_purchase",
                metadata: { planId: plan.id, planName: plan.name, paymentId: payment.id, checkoutSessionId: session.id },
              },
            }),
            prisma.billing.upsert({
              where: { organizationId: payment.organizationId },
              update: { planId: plan.id, subscriptionStatus: "ACTIVE" },
              create: { organizationId: payment.organizationId, planId: plan.id, subscriptionStatus: "ACTIVE" },
            }),
          ]);
          break;
        }
        case "checkout.session.expired": {
          const session = event.data.object as any;
          const paymentId = session?.metadata?.paymentId;
          if (paymentId) {
            await prisma.payment.update({ where: { id: paymentId }, data: { status: "expired" } }).catch(() => {});
          }
          break;
        }
        default:
          break;
      }
      return c.json({ received: true });
    } catch (e: any) {
      console.log(`[WEBHOOK] error: ${e?.message || e}`);
      return c.json({ success: false, message: e?.message || "Webhook handling failed" }, 500);
    } finally {
      await prisma.$disconnect();
    }
  });
};

// Helpers: Stripe webhook signature verification using SubtleCrypto
const encoder = new TextEncoder();

const toHex = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
};

const safeCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) {
    res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return res === 0;
};

const parseStripeSig = (header: string): { t: number; v1: string[] } | null => {
  const parts = header.split(",");
  let t = 0;
  const v1: string[] = [];
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k === "t") t = Number(v);
    else if (k === "v1") v1.push(v);
  }
  if (!t || v1.length === 0) return null;
  return { t, v1 };
};

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string, toleranceSec = 300): Promise<boolean> {
  const parsed = parseStripeSig(sigHeader);
  if (!parsed) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsed.t) > toleranceSec) return false;
  const signedPayload = `${parsed.t}.${payload}`;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expected = toHex(signature);
  for (const s of parsed.v1) {
    if (safeCompare(s, expected)) return true;
  }
  return false;
}
