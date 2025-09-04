import { apiClient } from './apiClient'
import type { Plan } from './plansService2'

export interface Organization {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  credits: number
  users?: {
    id: string
    name: string
    email: string
    role: string
  }[]
  billing?: {
    id: string
    organizationId: string
    planId: string
    subscriptionStatus: 'ACTIVE' | 'INACTIVE' | string
    stripeCustomerId: string | null
    stripeSubscriptionId: string | null
    currentPeriodStart: string | null
    currentPeriodEnd: string | null
    cancelAtPeriodEnd: boolean
    createdAt: string
    updatedAt: string
    plan: Plan
  }
}

export interface CreateOrganizationRequest {
  orgName: string
  name: string
  email: string
  password: string
}

interface OrganizationsResponse {
  organizations: Organization[]
  count: number
}

interface OrganizationResponse {
  organization: Organization
}

interface SummaryResponse {
  organizationsCount: number
  usersCount: number
  summary: {
    totalOrganizations: number
    totalUsers: number
  }
}

export class AdminService {
  /**
   * Get all organizations
   */
  static async getOrganizations(): Promise<Organization[]> {
    try {
      const response = await apiClient.get<OrganizationsResponse>(
        '/admin/get-organizations',
      )
      return response.data?.organizations || []
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
      throw error
    }
  }

  /**
   * Create a new organization with admin user
   */
  static async createOrganization(
    orgData: CreateOrganizationRequest,
  ): Promise<Organization> {
    try {
      const response = await apiClient.post<OrganizationResponse>(
        '/auth/register-org',
        orgData,
      )
      if (!response.data?.organization) {
        throw new Error('Organization creation failed')
      }
      return response.data.organization
    } catch (error) {
      console.error('Failed to create organization:', error)
      throw error
    }
  }

  /**
   * Get summary statistics (organizations and users count)
   */
  static async getSummary(): Promise<SummaryResponse> {
    try {
      const response =
        await apiClient.get<SummaryResponse>('/admin/get-summary')
      if (!response.data) {
        throw new Error('Failed to fetch summary data')
      }
      return response.data
    } catch (error) {
      console.error('Failed to fetch summary:', error)
      throw error
    }
  }
}
