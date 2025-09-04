import { apiClient } from './apiClient'

export interface Organization {
  id: string
  name: string
  createdAt: string
  credits: number
  users?: any[]
  billing?: any
  creditUsage?: any[]
}

export interface CreateOrganizationRequest {
  orgName: string
  name: string
  email: string
  password: string
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

interface OrganizationsResponse {
  organizations: Organization[]
  count: number
}

interface OrganizationResponse {
  organization: Organization
}

export class AdminService {
  /**
   * Get all organizations
   */
  static async getOrganizations(): Promise<Organization[]> {
    try {
      const response = await apiClient.get<ApiResponse<OrganizationsResponse>>(
        '/admin/get-organizations',
      )
      return response.data?.data?.organizations || []
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
      const response = await apiClient.post<ApiResponse<OrganizationResponse>>(
        '/auth/register-org',
        orgData,
      )
      if (!response.data?.data?.organization) {
        throw new Error('Organization creation failed')
      }
      return response.data.data.organization
    } catch (error) {
      console.error('Failed to create organization:', error)
      throw error
    }
  }
}
