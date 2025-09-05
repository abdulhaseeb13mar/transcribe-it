import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { store } from '../../store'
import { creditService } from '../../services/creditService'
import { plansService } from '../../services/plansService'
import { UserRole } from '../../types/enums'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui/card'
import { Button } from '../../components/ui/button'

// File-based routing: file path determines full route "/dashboard/payment-success"
export const Route = createFileRoute('/dashboard/payment-success')({
  beforeLoad: () => {
    const state = store.getState()
    const { isAuthenticated, user } = state.auth
    if (!isAuthenticated || !user || user.role !== UserRole.ADMIN) {
      throw redirect({ to: '/', search: { redirect: undefined } })
    }
  },
  component: PaymentSuccessPage,
})

function PaymentSuccessPage() {
  const router = useRouter()
  const [credits, setCredits] = useState<number | null>(null)
  const [planName, setPlanName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const [creditsRes, plansRes] = await Promise.all([
          creditService.getMyCredits(),
          plansService.getOrgPlans(),
        ])
        if (creditsRes.success && creditsRes.data)
          setCredits(creditsRes.data.credits)
        if (
          plansRes.success &&
          plansRes.data?.currentSubscription?.plan?.name
        ) {
          setPlanName(plansRes.data.currentSubscription.plan.name)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4 py-10">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Payment Successful ✅
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-700 dark:text-gray-300">
            Thank you! Your payment has been processed successfully.
          </p>
          {loading ? (
            <div className="text-sm text-gray-500">
              Refreshing your subscription…
            </div>
          ) : (
            <div className="space-y-2">
              {planName && (
                <div className="text-sm">
                  <span className="font-medium">Plan:</span> {planName}
                </div>
              )}
              {credits != null && (
                <div className="text-sm">
                  <span className="font-medium">Available Credits:</span>{' '}
                  {credits}
                </div>
              )}
            </div>
          )}
          <div className="pt-4 flex flex-col gap-2">
            <Button onClick={() => router.navigate({ to: '/dashboard/plans' })}>
              View Plans
            </Button>
            <Button
              variant="outline"
              onClick={() => router.navigate({ to: '/dashboard' })}
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
