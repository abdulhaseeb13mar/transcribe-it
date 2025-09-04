import { apiClient } from './apiClient'
import type { ApiResponse } from './apiClient'
import { PlanType } from '../types/enums'

// Request/Response Types based on backend schemas
export interface Plan {
  id: string
  name: string
  type: PlanType
  credits: number
  price: number // Decimal value
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePlanRequest {
  name: string
  type: PlanType
  credits: number
  price: number
  description?: string
  isActive?: boolean
}

export interface UpdatePlanRequest {
  name?: string
  type?: PlanType
  credits?: number
  price?: number
  description?: string
  isActive?: boolean
}

export interface PlanQueryParams {
  type?: PlanType
  isActive?: boolean
  page?: number
  limit?: number
  sort?: 'asc' | 'desc'
  sortBy?: 'name' | 'type' | 'credits' | 'price' | 'createdAt' | 'updatedAt'
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface GetPlansResponse {
  plans: Plan[]
  pagination: PaginationInfo
}

export interface GetActivePlansResponse {
  plans: Plan[]
}

export interface GetPlanResponse {
  plan: Plan
}

export interface CreatePlanResponse {
  plan: Plan
}

export interface UpdatePlanResponse {
  plan: Plan
}

class PlansService {
  /**
   * Get all plans with optional filtering and pagination
   */
  async getPlans(
    params?: PlanQueryParams,
  ): Promise<ApiResponse<GetPlansResponse>> {
    const searchParams = new URLSearchParams()

    if (params) {
      if (params.type) searchParams.append('type', params.type)
      if (params.isActive !== undefined)
        searchParams.append('isActive', params.isActive.toString())
      if (params.page) searchParams.append('page', params.page.toString())
      if (params.limit) searchParams.append('limit', params.limit.toString())
      if (params.sort) searchParams.append('sort', params.sort)
      if (params.sortBy) searchParams.append('sortBy', params.sortBy)
    }

    const queryString = searchParams.toString()
    const endpoint = queryString ? `/plans?${queryString}` : '/plans'

    return apiClient.get<GetPlansResponse>(endpoint)
  }

  /**
   * Get all active plans
   */
  async getActivePlans(): Promise<ApiResponse<GetActivePlansResponse>> {
    return apiClient.get<GetActivePlansResponse>('/plans/active')
  }

  /**
   * Get a single plan by ID
   */
  async getPlanById(id: string): Promise<ApiResponse<GetPlanResponse>> {
    return apiClient.get<GetPlanResponse>(`/plans/${id}`)
  }

  /**
   * Create a new plan
   * Requires super admin authentication
   */
  async createPlan(
    planData: CreatePlanRequest,
  ): Promise<ApiResponse<CreatePlanResponse>> {
    return apiClient.post<CreatePlanResponse>('/plans', planData)
  }

  /**
   * Update an existing plan
   * Requires super admin authentication
   */
  async updatePlan(
    id: string,
    planData: UpdatePlanRequest,
  ): Promise<ApiResponse<UpdatePlanResponse>> {
    return apiClient.put<UpdatePlanResponse>(`/plans/${id}`, planData)
  }

  /**
   * Delete a plan
   * Requires super admin authentication
   */
  async deletePlan(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`/plans/${id}`)
  }

  /**
   * Helper method to get plans formatted for display
   */
  async getPlansForDisplay(): Promise<Plan[]> {
    try {
      const response = await this.getActivePlans()
      if (response.success && response.data) {
        return response.data.plans
      }
      return []
    } catch (error) {
      console.error('Failed to fetch plans for display:', error)
      return []
    }
  }

  /**
   * Helper method to format price for display
   */
  static formatPrice(price: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price)
  }

  /**
   * Helper method to get plan type display name
   */
  static getPlanTypeDisplayName(type: PlanType): string {
    switch (type) {
      case PlanType.BASIC:
        return 'Basic'
      case PlanType.PREMIUM:
        return 'Premium'
      default:
        return type
    }
  }
}

export const plansService = new PlansService()
