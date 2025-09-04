import { createFileRoute } from '@tanstack/react-router'
import { SuperAdminDashboard } from '../../components/dashboard/SuperAdminDashboard'

export const Route = createFileRoute('/admin/dashboard')({
  component: AdminDashboardPage,
})

function AdminDashboardPage() {
  return <SuperAdminDashboard />
}
