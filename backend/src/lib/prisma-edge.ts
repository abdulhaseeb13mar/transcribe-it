import { PrismaClient } from "@prisma/client/edge";
import type { Env } from "../worker-env";

// Create a Prisma Edge client configured for Cloudflare Workers.
// In Workers, Prisma requires an Accelerate/Data Proxy connection string:
//  - PRISMA_ACCELERATE_URL starting with prisma:// or prisma+postgres://
export const createPrisma = (env: Env) => {
  const datasourceUrl = env.PRISMA_ACCELERATE_URL || env.DATABASE_URL;
  if (!datasourceUrl) {
    throw new Error("Missing PRISMA_ACCELERATE_URL (recommended) or DATABASE_URL.");
  }
  if (!/^prisma(\+postgres)?:\/\//.test(datasourceUrl)) {
    // Edge runtime requires Accelerate/Data Proxy connection string
    throw new Error(
      "Invalid datasource URL for Prisma Edge. Set PRISMA_ACCELERATE_URL (prisma:// or prisma+postgres://)."
    );
  }
  return new PrismaClient({ datasourceUrl });
};
