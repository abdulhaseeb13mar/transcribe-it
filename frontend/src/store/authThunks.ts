import { createAsyncThunk } from '@reduxjs/toolkit'
import { authService } from '../services/authService'
import { apiClient } from '../services/apiClient'
import type {
  LoginRequest,
  RegisterOrgRequest,
  CreateSuperAdminRequest,
} from '../services/authService'
import type { User, AuthSession } from './slices/authSlice'
import { UserRole } from '../types/enums'

// Convert backend role to frontend role format
const mapUserRole = (backendRole: string): UserRole => {
  return backendRole as UserRole
}

// Login thunk
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials)

      if (!response.success || !response.data) {
        const errorMessage =
          typeof response.error === 'object' && response.error?.message
            ? response.error.message
            : response.message || 'Login failed'
        throw new Error(errorMessage)
      }

      const { token, refreshToken, expiresAt } = response.data
      apiClient.setToken(token)

      // Get user profile to check role
      const profileResponse = await authService.getUserProfile()

      if (!profileResponse.success || !profileResponse.data) {
        throw new Error('Failed to get user profile')
      }

      const userProfile = profileResponse.data.user

      const user: User = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role as User['role'],
        organizationId: userProfile.organizationId,
        organizationName: userProfile.organizationName,
      }

      const session: AuthSession = {
        token,
        refreshToken,
        expiresAt,
      }

      // Set the token in the API client for immediate use
      apiClient.setToken(token)

      return { user, session }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Login failed')
    }
  },
)

// Super admin login (same endpoint but we need to check if user is super admin)
export const loginSuperAdmin = createAsyncThunk(
  'auth/loginSuperAdmin',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials)

      if (!response.success || !response.data) {
        const errorMessage =
          typeof response.error === 'object' && response.error?.message
            ? response.error.message
            : response.message || 'Login failed'
        throw new Error(errorMessage)
      }

      const { token, refreshToken, expiresAt } = response.data
      apiClient.setToken(token)

      // Get user profile to check role
      const profileResponse = await authService.getUserProfile()

      if (!profileResponse.success || !profileResponse.data) {
        throw new Error('Failed to get user profile')
      }

      const userProfile = profileResponse.data.user

      // Check if user is super admin
      if (userProfile.role !== UserRole.SUPER_ADMIN) {
        throw new Error('Unauthorized: Only super admins can access this area')
      }

      const user: User = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role as User['role'],
        organizationId: userProfile.organizationId,
        organizationName: userProfile.organizationName,
      }

      const session: AuthSession = {
        token,
        refreshToken,
        expiresAt,
      }

      // Set the token in the API client for immediate use
      apiClient.setToken(token)

      return { user, session }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Super admin login failed')
    }
  },
)

// Register organization thunk
export const registerOrganization = createAsyncThunk(
  'auth/registerOrganization',
  async (data: RegisterOrgRequest, { rejectWithValue }) => {
    try {
      const response = await authService.registerOrganization(data)

      if (!response.success || !response.data) {
        const errorMessage =
          typeof response.error === 'object' && response.error?.message
            ? response.error.message
            : response.message || 'Registration failed'
        throw new Error(errorMessage)
      }

      const { user: backendUser, organization } = response.data

      const user: User = {
        id: backendUser.id,
        email: backendUser.email,
        name: backendUser.name,
        role: mapUserRole(backendUser.role),
        organizationId: organization.id,
        organizationName: organization.name,
      }

      return {
        user,
        organization,
        needsEmailVerification: response.data.needsEmailVerification,
      }
    } catch (error: any) {
      return rejectWithValue(
        error.message || 'Organization registration failed',
      )
    }
  },
)

// Create super admin thunk
export const createSuperAdmin = createAsyncThunk(
  'auth/createSuperAdmin',
  async (data: CreateSuperAdminRequest, { rejectWithValue }) => {
    try {
      const response = await authService.createSuperAdmin(data)

      if (!response.success || !response.data) {
        const errorMessage =
          typeof response.error === 'object' && response.error?.message
            ? response.error.message
            : response.message || 'Super admin creation failed'
        throw new Error(errorMessage)
      }

      const { superAdmin } = response.data

      return {
        superAdmin: {
          id: superAdmin.id,
          email: superAdmin.email,
          name: superAdmin.name,
          role: superAdmin.role,
          createdAt: superAdmin.createdAt,
        },
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Super admin creation failed')
    }
  },
)

// Check super admin exists thunk
export const checkSuperAdminExists = createAsyncThunk(
  'auth/checkSuperAdminExists',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.checkSuperAdminExists()

      if (!response.success || !response.data) {
        const errorMessage =
          typeof response.error === 'object' && response.error?.message
            ? response.error.message
            : response.message || 'Failed to check super admin'
        throw new Error(errorMessage)
      }

      return response.data
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to check super admin')
    }
  },
)

// Logout thunk
export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try {
    await authService.logout()
  } catch (error: any) {
    // Even if logout fails on server, we should clear local state
    console.warn('Logout request failed, but clearing local state:', error)
  } finally {
    // Always clear the token from API client
    apiClient.clearToken()
  }
  return true
})

// Get user profile thunk
export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getUserProfile()

      if (!response.success || !response.data) {
        const errorMessage =
          typeof response.error === 'object' && response.error?.message
            ? response.error.message
            : response.message || 'Failed to get user profile'
        throw new Error(errorMessage)
      }

      const userProfile = response.data.user

      const user: User = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.name,
        role: userProfile.role as User['role'],
        organizationId: userProfile.organizationId,
        organizationName: userProfile.organizationName,
      }

      return user
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to get user profile')
    }
  },
)
