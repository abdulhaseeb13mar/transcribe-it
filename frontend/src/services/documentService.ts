import { apiClient } from './apiClient'
import type { ApiResponse } from './apiClient'

export interface ExtractResponseData {
  type?: string
  text: string
  pages?: number
  warnings?: string[]
  fileName?: string
  mimeType?: string
  forceOcr?: boolean
}

export interface TranslateResponseData {
  translation: string
  sourceLang: string
  targetLang: string
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = (e) => reject(e)
    reader.readAsDataURL(file)
  })
}

class DocumentService {
  async extractTextFromFile(
    file: File,
    options?: { forceOcr?: boolean },
  ): Promise<ApiResponse<ExtractResponseData>> {
    const contentBase64 = await fileToBase64(file)
    // Backend mounts document routes under /api/document
    return apiClient.post<ExtractResponseData>('/document/extract', {
      contentBase64,
      fileName: file.name,
      mimeType: file.type || undefined,
      forceOcr: Boolean(options?.forceOcr),
    })
  }

  async translateText(payload: {
    text: string
    sourceLang: string
    targetLang?: string
  }): Promise<ApiResponse<TranslateResponseData>> {
    const body = {
      text: payload.text,
      sourceLang: payload.sourceLang,
      targetLang: payload.targetLang || 'en',
    }
    // Backend mounts document routes under /api/document
    return apiClient.post<TranslateResponseData>('/document/translate-text', body)
  }
}

export const documentService = new DocumentService()
export type { ApiResponse }
