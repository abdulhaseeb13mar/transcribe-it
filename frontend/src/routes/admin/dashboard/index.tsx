import { createFileRoute } from '@tanstack/react-router'
import { OverviewDashboard } from '../../../components/dashboard/admin/OverviewDashboard'

export const Route = createFileRoute('/admin/dashboard/')({
  component: OverviewComponent,
})

function OverviewComponent() {
  // TODO: Replace with actual API calls
  const stats = {
    organizationsCount: 2,
    usersCount: 3,
    systemStatus: 'operational' as const,
  }

  return <OverviewDashboard stats={stats} />
}
