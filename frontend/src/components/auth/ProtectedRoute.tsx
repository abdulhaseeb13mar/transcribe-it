import React from 'react'
import { useSelector } from '@/store'
import type { User } from '../../store/slices/authSlice'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: User['role'][]
  fallback?: React.ReactNode
}

export function ProtectedRoute({
  children,
  allowedRoles,
  fallback,
}: ProtectedRouteProps) {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated)
  const user = useSelector((state) => state.auth.user)

  if (!isAuthenticated || !user) {
    return fallback || <div>Unauthorized</div>
  }

  if (!allowedRoles.includes(user.role)) {
    return fallback || <div>Access Denied</div>
  }

  return <>{children}</>
}
