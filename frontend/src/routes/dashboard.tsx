import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { store } from '../store'
import { UserRole } from '../types/enums'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ location }) => {
    const state = store.getState()
    const { isAuthenticated, user } = state.auth

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: undefined,
        },
      })
    }

    // Check if user has admin role
    if (user.role !== UserRole.ADMIN) {
      throw redirect({
        to: '/login',
        search: {
          redirect: undefined,
        },
      })
    }
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  return <Outlet />
}
