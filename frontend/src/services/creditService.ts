import { apiClient } from './apiClient'

export interface CreditUsageItem {
  id: string
  creditsUsed: number
  operation: string
  metadata?: Record<string, any>
  createdAt: string
}

export interface MyCreditsResponse {
  organization: { id: string; name: string }
  credits: number
  recentUsage: CreditUsageItem[]
}

class CreditService {
  async getMyCredits() {
    return apiClient.get<MyCreditsResponse>('/credits/me')
  }
}

export const creditService = new CreditService()

