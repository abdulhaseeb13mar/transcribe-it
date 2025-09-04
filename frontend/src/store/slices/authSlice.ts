import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import {
  loginUser,
  loginSuperAdmin,
  registerOrganization,
  logoutUser,
  getUserProfile,
  createSuperAdmin,
  checkSuperAdminExists,
} from '../authThunks'
import { UserRole } from '../../types/enums'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  organizationId?: string
  organizationName?: string
}

export interface AuthSession {
  token: string
  refreshToken: string
  expiresAt: number
}

interface AuthState {
  user: User | null
  session: AuthSession | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  superAdminExists: boolean | null
}

const initialState: AuthState = {
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  superAdminExists: null,
}

interface LoginSuccessPayload {
  user: User
  session: AuthSession
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (state, action: PayloadAction<LoginSuccessPayload>) => {
      state.isLoading = false
      state.isAuthenticated = true
      state.user = action.payload.user
      state.session = action.payload.session
      state.error = null
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false
      state.isAuthenticated = false
      state.user = null
      state.session = null
      state.error = action.payload
    },
    logout: (state) => {
      state.isAuthenticated = false
      state.user = null
      state.session = null
      state.error = null
    },
    clearError: (state) => {
      state.error = null
    },
    setUserProfile: (state, action: PayloadAction<User>) => {
      state.user = action.payload
    },
  },
  extraReducers: (builder) => {
    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.session = action.payload.session
        state.error = null
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.session = null
        state.error = action.payload as string
      })

    // Login super admin
    builder
      .addCase(loginSuperAdmin.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(loginSuperAdmin.fulfilled, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = true
        state.user = action.payload.user
        state.session = action.payload.session
        state.error = null
      })
      .addCase(loginSuperAdmin.rejected, (state, action) => {
        state.isLoading = false
        state.isAuthenticated = false
        state.user = null
        state.session = null
        state.error = action.payload as string
      })

    // Register organization
    builder
      .addCase(registerOrganization.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(registerOrganization.fulfilled, (state, action) => {
        state.isLoading = false
        state.user = action.payload.user
        // Note: For organization registration, user might need email verification
        // so we don't set isAuthenticated = true immediately
        state.error = null
      })
      .addCase(registerOrganization.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.isAuthenticated = false
      state.user = null
      state.session = null
      state.error = null
    })

    // Get user profile
    builder
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.user = action.payload
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.error = action.payload as string
      })

    // Create super admin
    builder
      .addCase(createSuperAdmin.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createSuperAdmin.fulfilled, (state) => {
        state.isLoading = false
        state.superAdminExists = true
        state.error = null
      })
      .addCase(createSuperAdmin.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

    // Check super admin exists
    builder.addCase(checkSuperAdminExists.fulfilled, (state, action) => {
      state.superAdminExists = action.payload.exists
    })
  },
})

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  clearError,
  setUserProfile,
} = authSlice.actions

export type { AuthState }
export default authSlice.reducer
