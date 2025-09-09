// Hono/Cloudflare Worker environment bindings
export interface Env {
  // App
  NODE_ENV?: string;
  CORS_ORIGIN?: string;

  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;

  // Payments / Stripe
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  FRONTEND_SUCCESS_URL?: string;
  FRONTEND_CANCEL_URL?: string;

  // GenAI / OCR
  GOOGLE_API_KEY?: string;
  GENAI_API_KEY?: string;
  GENAI_MODEL?: string;

  // Optional: DB/Prisma Accelerate
  DATABASE_URL?: string;
  PRISMA_ACCELERATE_URL?: string;
}
