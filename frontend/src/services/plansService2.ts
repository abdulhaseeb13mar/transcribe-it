import { apiClient } from './apiClient'

export interface PlanDto {
  id: string
  name: string
  type: 'BASIC' | 'PREMIUM' | string
  credits: number
  price: string | number
  description?: string | null
}

export interface PlansInfoResponse {
  plans: PlanDto[]
  currentSubscription: {
    planId: string
    plan: PlanDto
    status: string
    currentPeriodStart?: string | null
    currentPeriodEnd?: string | null
    cancelAtPeriodEnd?: boolean
  } | null
}

class PlansService {
  async getPlans() {
    return apiClient.get<PlansInfoResponse>('/plans')
  }

  async subscribe(planId: string) {
    return apiClient.post('/plans/subscribe', { planId })
  }
}

export const plansService = new PlansService()

