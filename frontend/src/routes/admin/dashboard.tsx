import { createFileRoute, redirect } from '@tanstack/react-router'
import { SuperAdminDashboard } from '../../components/dashboard/SuperAdminDashboard'
import { store } from '../../store'
import { UserRole } from '../../types/enums'

export const Route = createFileRoute('/admin/dashboard')({
  beforeLoad: ({ location }) => {
    const state = store.getState()
    const { isAuthenticated, user } = state.auth

    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      throw redirect({
        to: '/admin',
        search: {
          redirect: location.href,
          // redirect: location.href,
        },
      })
    }

    // Check if user has super admin role
    if (user.role !== UserRole.SUPER_ADMIN) {
      throw redirect({
        to: '/admin',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AdminDashboardPage,
})

function AdminDashboardPage() {
  return <SuperAdminDashboard />
}
