import { apiClient } from './apiClient'
import type { PlanType } from '../types/enums'

// Org-facing plan summary
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
  // Org: list active plans + current subscription
  async getOrgPlans() {
    return apiClient.get<PlansInfoResponse>('/plans')
  }

  // Org: subscribe to a plan
  async subscribe(planId: string) {
    return apiClient.post('/plans/subscribe', { planId })
  }

  // Admin: full plans listing with pagination/filters
  async adminGetPlans(params?: Partial<{
    type: PlanType
    isActive: boolean
    page: number
    limit: number
    sort: 'asc' | 'desc'
    sortBy: 'name' | 'type' | 'credits' | 'price' | 'createdAt' | 'updatedAt'
  }>) {
    const qs = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null) return
        qs.set(k, String(v))
      })
    }
    const url = `/admin/plans${qs.toString() ? `?${qs.toString()}` : ''}`
    return apiClient.get<PlansListResponse>(url)
  }

  // Admin: create a new plan
  async createPlan(body: CreatePlanRequest) {
    return apiClient.post<{ plan: Plan }>(`/admin/plans`, body)
  }
}

export const plansService = new PlansService()

// Admin types
export interface Plan {
  id: string
  name: string
  type: PlanType | string
  credits: number
  price: number
  description?: string | null
  isActive: boolean
  createdAt: string
  updatedAt?: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PlansListResponse {
  plans: Plan[]
  pagination: PaginationInfo
}

export interface CreatePlanRequest {
  name: string
  type: PlanType
  credits: number
  price: number
  description?: string
  isActive?: boolean
}
