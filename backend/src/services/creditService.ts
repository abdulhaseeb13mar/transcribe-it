import { prisma } from "../lib/prisma";

export type CreditOperation = "translation" | "extract_and_translate";

export class CreditService {
  // Simple heuristic: 1 credit per 1000 characters, minimum 1.
  computeRequiredCreditsForTranslation(textLength: number): number {
    const per = 1000;
    const credits = Math.ceil((textLength || 0) / per);
    return Math.max(1, credits);
  }

  async ensureSufficientCredits(organizationId: string, required: number): Promise<void> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { credits: true },
    });
    if (!org) {
      throw new Error("Organization not found");
    }
    if ((org.credits || 0) < required) {
      throw new Error("Insufficient credits for this operation");
    }
  }

  async deductAndRecord(params: {
    organizationId: string;
    creditsUsed: number;
    operation: CreditOperation;
    metadata?: Record<string, any>;
  }): Promise<number> {
    const { organizationId, creditsUsed, operation, metadata } = params;
    const [updated] = await prisma.$transaction([
      prisma.organization.update({
        where: { id: organizationId },
        data: { credits: { decrement: creditsUsed } },
        select: { credits: true },
      }),
      prisma.creditUsage.create({
        data: {
          organizationId,
          creditsUsed,
          operation,
          metadata: metadata || undefined,
        },
      }),
    ]);
    return updated.credits;
  }
}
