import {
  Transcription,
  CreateTranscriptionInput,
  UpdateTranscriptionInput,
  TranscriptionStatus,
} from "../types";
import { prisma } from "../lib/prisma";

export class TranscriptionService {
  async createTranscription(
    transcriptionData: CreateTranscriptionInput
  ): Promise<Transcription> {
    try {
      const transcription = await prisma.transcription.create({
        data: {
          userId: transcriptionData.userId,
          title: transcriptionData.title,
          text: transcriptionData.text,
          language: transcriptionData.language,
          confidence: transcriptionData.confidence,
          duration: transcriptionData.duration,
          wordCount: transcriptionData.wordCount,
          fileUrl: transcriptionData.fileUrl,
          status: transcriptionData.status,
        },
      });

      return transcription;
    } catch (error: any) {
      throw new Error(`Failed to create transcription: ${error.message}`);
    }
  }

  async findTranscriptionById(id: string): Promise<Transcription | null> {
    try {
      const transcription = await prisma.transcription.findUnique({
        where: { id },
        include: {
          user: true,
        },
      });

      return transcription;
    } catch (error: any) {
      throw new Error(`Failed to find transcription: ${error.message}`);
    }
  }

  async findTranscriptionsByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ transcriptions: Transcription[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [transcriptions, total] = await Promise.all([
        prisma.transcription.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.transcription.count({
          where: { userId },
        }),
      ]);

      return { transcriptions, total };
    } catch (error: any) {
      throw new Error(`Failed to find transcriptions: ${error.message}`);
    }
  }

  async updateTranscription(
    id: string,
    updates: UpdateTranscriptionInput
  ): Promise<Transcription | null> {
    try {
      const transcription = await prisma.transcription.update({
        where: { id },
        data: updates,
      });

      return transcription;
    } catch (error: any) {
      if (error.code === "P2025") {
        return null; // Transcription not found
      }
      throw new Error(`Failed to update transcription: ${error.message}`);
    }
  }

  async deleteTranscription(id: string): Promise<boolean> {
    try {
      await prisma.transcription.delete({
        where: { id },
      });

      return true;
    } catch (error: any) {
      if (error.code === "P2025") {
        return false; // Transcription not found
      }
      throw new Error(`Failed to delete transcription: ${error.message}`);
    }
  }

  async searchTranscriptions(
    userId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ transcriptions: Transcription[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [transcriptions, total] = await Promise.all([
        prisma.transcription.findMany({
          where: {
            userId,
            OR: [
              {
                title: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
              {
                text: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
            ],
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.transcription.count({
          where: {
            userId,
            OR: [
              {
                title: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
              {
                text: {
                  contains: searchTerm,
                  mode: "insensitive",
                },
              },
            ],
          },
        }),
      ]);

      return { transcriptions, total };
    } catch (error: any) {
      throw new Error(`Failed to search transcriptions: ${error.message}`);
    }
  }

  async getTranscriptionsByStatus(
    status: TranscriptionStatus,
    page: number = 1,
    limit: number = 10
  ): Promise<{ transcriptions: Transcription[]; total: number }> {
    try {
      const skip = (page - 1) * limit;

      const [transcriptions, total] = await Promise.all([
        prisma.transcription.findMany({
          where: { status },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            user: true,
          },
        }),
        prisma.transcription.count({
          where: { status },
        }),
      ]);

      return { transcriptions, total };
    } catch (error: any) {
      throw new Error(
        `Failed to get transcriptions by status: ${error.message}`
      );
    }
  }

  async updateTranscriptionStatus(
    id: string,
    status: TranscriptionStatus
  ): Promise<Transcription | null> {
    try {
      const transcription = await prisma.transcription.update({
        where: { id },
        data: { status },
      });

      return transcription;
    } catch (error: any) {
      if (error.code === "P2025") {
        return null; // Transcription not found
      }
      throw new Error(
        `Failed to update transcription status: ${error.message}`
      );
    }
  }
}
