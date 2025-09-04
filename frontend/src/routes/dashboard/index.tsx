import { createFileRoute } from '@tanstack/react-router'
import { OrganizationDashboard } from '../../components/dashboard/OrganizationDashboard'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardIndex,
})

function DashboardIndex() {
  return <OrganizationDashboard />
}

