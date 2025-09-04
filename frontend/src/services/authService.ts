import { apiClient } from './apiClient'
import type { ApiResponse } from './apiClient'

// Request/Response Types based on backend schemas
export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: {
    id: string
    email: string
    name: string
  }
  token: string
  refreshToken: string
  expiresAt: number
}

export interface RegisterOrgRequest {
  email: string
  password: string
  name: string
  orgName: string
}

export interface RegisterOrgResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
  }
  organization: {
    id: string
    name: string
    credits: number
  }
  needsEmailVerification: boolean
}

export interface UserProfileResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
    organizationId?: string
    organizationName?: string
    createdAt: string
    updatedAt: string
  }
}

export interface SuperAdminCheckResponse {
  exists: boolean
  message: string
}

export interface CreateSuperAdminRequest {
  email: string
  name: string
  password: string
}

export interface CreateSuperAdminResponse {
  superAdmin: {
    id: string
    email: string
    name: string
    role: string
    createdAt: string
  }
}

class AuthService {
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>('/auth/login', credentials, true) // Skip auth for login
  }

  async registerOrganization(
    data: RegisterOrgRequest,
  ): Promise<ApiResponse<RegisterOrgResponse>> {
    return apiClient.post<RegisterOrgResponse>('/auth/register-org', data, true) // Skip auth for registration
  }

  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post<void>('/auth/logout') // Requires auth
  }

  async getUserProfile(): Promise<ApiResponse<UserProfileResponse>> {
    return apiClient.get<UserProfileResponse>('/auth/me') // Requires auth
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>(
      '/auth/refresh',
      { refreshToken },
      true,
    ) // Skip auth for refresh
  }

  // Super Admin endpoints
  async checkSuperAdminExists(): Promise<ApiResponse<SuperAdminCheckResponse>> {
    return apiClient.get<SuperAdminCheckResponse>(
      '/admin/super-admin/check',
      true,
    ) // Skip auth for checking if super admin exists
  }

  async createSuperAdmin(
    data: CreateSuperAdminRequest,
  ): Promise<ApiResponse<CreateSuperAdminResponse>> {
    return apiClient.post<CreateSuperAdminResponse>(
      '/admin/super-admin',
      data,
      true,
    ) // Skip auth for creating first super admin
  }
}

export const authService = new AuthService()
