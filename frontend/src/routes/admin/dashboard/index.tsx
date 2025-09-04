import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { OverviewDashboard } from '../../../components/dashboard/admin/OverviewDashboard'
import { AdminService } from '../../../services/adminService'

export const Route = createFileRoute('/admin/dashboard/')({
  component: OverviewComponent,
})

interface SummaryStats {
  organizationsCount: number
  usersCount: number
  systemStatus: 'operational' | 'maintenance' | 'down'
}

function OverviewComponent() {
  const [stats, setStats] = useState<SummaryStats | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSummary()
  }, [])

  const loadSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      const summaryData = await AdminService.getSummary()

      // Map the API response to the component's expected format
      const mappedStats: SummaryStats = {
        organizationsCount: summaryData.organizationsCount,
        usersCount: summaryData.usersCount - 1,
        systemStatus: 'operational' as const, // Default to operational
      }

      setStats(mappedStats)
    } catch (error) {
      console.error('Failed to load summary:', error)
      setError('Failed to load dashboard summary')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading dashboard summary...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadSummary}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return <OverviewDashboard stats={stats} />
}
