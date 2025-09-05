import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import { store } from '../../store'
import { UserRole } from '../../types/enums'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui/card'
import { Button } from '../../components/ui/button'

export const Route = createFileRoute('/dashboard/payment-cancel')({
  beforeLoad: () => {
    const state = store.getState()
    const { isAuthenticated, user } = state.auth
    if (!isAuthenticated || !user || user.role !== UserRole.ADMIN) {
      throw redirect({ to: '/', search: { redirect: undefined } })
    }
  },
  component: PaymentCancelPage,
})

function PaymentCancelPage() {
  const router = useRouter()
  useEffect(() => {
    // Could add analytics/event tracking
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4 py-10">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Payment Cancelled ❌
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          <p className="text-gray-700 dark:text-gray-300">
            Your payment was not completed. You can retry the purchase when
            you're ready.
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <Button onClick={() => router.navigate({ to: '/dashboard/plans' })}>
              Return to Plans
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
