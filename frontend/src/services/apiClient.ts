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

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    // Add auth token if available
    const token = this.getStoredToken()
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        // Handle backend error structure: { success: false, error: { message: "..." } }
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
      const persistedState = localStorage.getItem('persist:root')
      if (persistedState) {
        const parsed = JSON.parse(persistedState)
        const authState = JSON.parse(parsed.auth)
        return authState?.token || null
      }
    } catch (error) {
      console.warn('Failed to retrieve stored token:', error)
    }
    return null
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
export type { ApiResponse, ApiError }
