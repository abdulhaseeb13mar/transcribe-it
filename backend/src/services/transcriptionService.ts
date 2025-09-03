import { Transcription } from "../types";

// Mock database for demonstration
const transcriptions: Transcription[] = [];

export class TranscriptionService {
  async createTranscription(
    transcriptionData: Omit<Transcription, "id" | "createdAt" | "updatedAt">
  ): Promise<Transcription> {
    const transcription: Transcription = {
      id: Math.random().toString(36).substr(2, 9),
      ...transcriptionData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    transcriptions.push(transcription);
    return transcription;
  }

  async findTranscriptionById(id: string): Promise<Transcription | null> {
    return transcriptions.find((t) => t.id === id) || null;
  }

  async findTranscriptionsByUserId(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ transcriptions: Transcription[]; total: number }> {
    const userTranscriptions = transcriptions.filter(
      (t) => t.userId === userId
    );
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      transcriptions: userTranscriptions.slice(startIndex, endIndex),
      total: userTranscriptions.length,
    };
  }

  async updateTranscription(
    id: string,
    updates: Partial<Transcription>
  ): Promise<Transcription | null> {
    const transcriptionIndex = transcriptions.findIndex((t) => t.id === id);

    if (transcriptionIndex === -1) {
      return null;
    }

    const existingTranscription = transcriptions[transcriptionIndex];
    transcriptions[transcriptionIndex] = {
      ...existingTranscription,
      ...updates,
      updatedAt: new Date(),
    };

    return transcriptions[transcriptionIndex] || null;
  }

  async deleteTranscription(id: string): Promise<boolean> {
    const transcriptionIndex = transcriptions.findIndex((t) => t.id === id);

    if (transcriptionIndex === -1) {
      return false;
    }

    transcriptions.splice(transcriptionIndex, 1);
    return true;
  }

  async searchTranscriptions(
    userId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ transcriptions: Transcription[]; total: number }> {
    const userTranscriptions = transcriptions.filter(
      (t) =>
        t.userId === userId &&
        (t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.text.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return {
      transcriptions: userTranscriptions.slice(startIndex, endIndex),
      total: userTranscriptions.length,
    };
  }
}
