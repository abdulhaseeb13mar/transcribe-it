import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'

interface OverviewStats {
  organizationsCount: number
  usersCount: number
  systemStatus: 'operational' | 'maintenance' | 'down'
}

interface OverviewDashboardProps {
  stats?: OverviewStats
}

export function OverviewDashboard({ stats }: OverviewDashboardProps) {
  // Default stats if not provided
  const defaultStats: OverviewStats = {
    organizationsCount: 0,
    usersCount: 0,
    systemStatus: 'operational',
  }

  const currentStats = stats || defaultStats

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Total Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-blue-600">
            {currentStats.organizationsCount}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Total Users</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-green-600">
            {currentStats.usersCount}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
