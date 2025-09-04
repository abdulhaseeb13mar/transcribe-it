import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { PlansDashboard } from '../../../../components/dashboard/admin/plansDashboard'
import { plansService } from '../../../../services/plansService2'
import type {
  Plan,
  CreatePlanRequest,
} from '../../../../services/plansService2'

export const Route = createFileRoute('/admin/dashboard/plans/')({
  component: PlansRoute,
})

function PlansRoute() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await plansService.getPlans()

      if (response.success && response.data) {
        setPlans(response.data.plans)
      } else {
        setError(response.message || 'Failed to fetch plans')
      }
    } catch (err) {
      console.error('Error fetching plans:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = async (planData: CreatePlanRequest) => {
    try {
      const response = await plansService.createPlan(planData)

      if (response.success) {
        // Refresh the plans list
        await fetchPlans()
      } else {
        throw new Error(response.message || 'Failed to create plan')
      }
    } catch (error) {
      console.error('Error creating plan:', error)
      throw error // Re-throw to be handled by the component
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-600 dark:text-gray-400">Loading plans...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-600 dark:text-red-400">Error: {error}</div>
      </div>
    )
  }

  return (
    <PlansDashboard
      plans={plans}
      onCreatePlan={handleCreatePlan}
      onRefresh={fetchPlans}
    />
  )
}
