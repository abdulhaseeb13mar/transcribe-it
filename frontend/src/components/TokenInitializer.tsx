import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { apiClient } from '../services/apiClient'
import type { RootState } from '../store'

interface TokenInitializerProps {
  children: React.ReactNode
}

/**
 * Component that initializes the API client with the stored token
 * when the Redux persist gate loads the persisted state
 */
export function TokenInitializer({ children }: TokenInitializerProps) {
  const token = useSelector((state: RootState) => state.auth.session?.token)

  useEffect(() => {
    // Set the token in the API client whenever it changes
    apiClient.setToken(token || null)
  }, [token])

  return <>{children}</>
}
