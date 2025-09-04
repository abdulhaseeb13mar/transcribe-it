// API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

interface ApiResponse<T = any> {
  success: boolean
  message: string
  data?: T
  error?:
    | {
        message?: string
        stack?: string
      }
    | string
}

interface ApiError {
  success: false
  message: string
  error?: string
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  // Method to set token manually (useful for immediate updates)
  setToken(token: string | null): void {
    this.token = token
  }

  // Method to clear the token
  clearToken(): void {
    this.token = null
  }

  // Method to get the current token (prioritizes manual token over stored)
  private getToken(): string | null {
    return this.token || this.getStoredToken()
  }

  // Method to get the refresh token from stored state
  private getStoredRefreshToken(): string | null {
    try {
      // Try to get from the persisted auth state
      const persistedAuthState = localStorage.getItem('persist:auth')
      if (persistedAuthState) {
        const authState = JSON.parse(persistedAuthState)
        return authState?.session?.refreshToken || null
      }

      // Fallback: try to get from root persist state (if store structure changes)
      const persistedRootState = localStorage.getItem('persist:root')
      if (persistedRootState) {
        const parsed = JSON.parse(persistedRootState)
        const authState = JSON.parse(parsed.auth)
        return authState?.session?.refreshToken || null
      }
    } catch (error) {
      console.warn('Failed to retrieve stored refresh token:', error)
    }
    return null
  }

  // Method to attempt token refresh
  async attemptTokenRefresh(): Promise<boolean> {
    const refreshToken = this.getStoredRefreshToken()
    if (!refreshToken) {
      return false
    }

    try {
      // Make refresh request directly to avoid circular dependency
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.token) {
          this.setToken(data.data.token)
          return true
        }
      }
    } catch (error) {
      console.warn('Token refresh failed:', error)
    }

    return false
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    skipAuth: boolean = false,
    isRetry: boolean = false,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add auth token if available and not skipping auth
    if (!skipAuth) {
      const token = this.getToken()
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        }
      }
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401 && !skipAuth && !isRetry) {
          // Try to refresh token once
          const refreshSuccess = await this.attemptTokenRefresh()
          if (refreshSuccess) {
            // Retry the request with the new token
            return this.request<T>(endpoint, options, skipAuth, true)
          }

          // Clear invalid token
          this.setToken(null)

          // Handle backend error structure: { success: false, error: { message: "..." } }
          const errorMessage =
            data.error?.message ||
            data.message ||
            'Authentication failed. Please log in again.'
          throw new Error(errorMessage)
        }

        // Handle other backend errors
        const errorMessage =
          data.error?.message ||
          data.message ||
          `HTTP error! status: ${response.status}`
        throw new Error(errorMessage)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  private getStoredToken(): string | null {
    try {
      // Try to get from the persisted auth state
      const persistedAuthState = localStorage.getItem('persist:auth')
      if (persistedAuthState) {
        const authState = JSON.parse(persistedAuthState)
        return authState?.session?.token || null
      }

      // Fallback: try to get from root persist state (if store structure changes)
      const persistedRootState = localStorage.getItem('persist:root')
      if (persistedRootState) {
        const parsed = JSON.parse(persistedRootState)
        const authState = JSON.parse(parsed.auth)
        return authState?.session?.token || null
      }
    } catch (error) {
      console.warn('Failed to retrieve stored token:', error)
    }
    return null
  }

  async get<T>(
    endpoint: string,
    skipAuth: boolean = false,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' }, skipAuth, false)
  }

  async post<T>(
    endpoint: string,
    data?: any,
    skipAuth: boolean = false,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      skipAuth,
      false,
    )
  }

  async put<T>(
    endpoint: string,
    data?: any,
    skipAuth: boolean = false,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      skipAuth,
      false,
    )
  }

  async delete<T>(
    endpoint: string,
    skipAuth: boolean = false,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' }, skipAuth, false)
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export type { ApiResponse, ApiError }
