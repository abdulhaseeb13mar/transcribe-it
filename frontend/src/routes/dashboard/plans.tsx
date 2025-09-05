import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { store, useSelector } from '../../store'
import {
  plansService,
  type PlansInfoResponse,
} from '../../services/plansService'
import { creditService } from '../../services/creditService'
import { paymentService } from '../../services/paymentService'
import { UserRole } from '../../types/enums'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui/card'
import { Button } from '../../components/ui/button'

export const Route = createFileRoute('/dashboard/plans')({
  beforeLoad: () => {
    const state = store.getState()
    const { isAuthenticated, user } = state.auth
    if (!isAuthenticated || !user || user.role !== UserRole.ADMIN) {
      throw redirect({ to: '/', search: { redirect: undefined } })
    }
  },
  component: PlansPage,
})

function PlansPage() {
  const token = useSelector((s) => s.auth.session?.token)
  const [data, setData] = useState<PlansInfoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState<number | null>(null)
  const [subscribing, setSubscribing] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    ;(async () => {
      try {
        setLoading(true)
        const [plansRes, creditsRes] = await Promise.all([
          plansService.getOrgPlans(),
          creditService.getMyCredits(),
        ])
        if (plansRes.success && plansRes.data) setData(plansRes.data)
        if (creditsRes.success && creditsRes.data)
          setCredits(creditsRes.data.credits)
        setError(null)
      } catch (e: any) {
        setError(e?.message || 'Failed to load plans')
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  const currentPlanId = data?.currentSubscription?.planId

  const handleSubscribe = async (planId: string) => {
    try {
      setSubscribing(planId)
      const res = await paymentService.createCheckout(planId)
      if (!res.success || !res.data?.checkoutUrl)
        throw new Error(res.message || 'Failed to start checkout')
      // Redirect to Stripe Checkout
      window.location.href = res.data.checkoutUrl
    } catch (e: any) {
      setError(e?.message || 'Subscription failed')
    } finally {
      setSubscribing(null)
    }
  }

  const formatPrice = (price: string | number) => {
    const n = Number(price)
    if (!Number.isFinite(n)) return String(price)
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'USD',
    }).format(n)
  }

  // const StatusBadge = ({ status }: { status?: string }) => {
  //   if (!status) return null
  //   const s = status.toUpperCase()
  //   const map: Record<string, string> = {
  //     ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  //     PAST_DUE: 'bg-amber-100 text-amber-800 border-amber-200',
  //     INACTIVE: 'bg-slate-100 text-slate-800 border-slate-200',
  //     CANCELLED: 'bg-red-100 text-red-800 border-red-200',
  //   }
  //   const cls = map[s] || 'bg-slate-100 text-slate-800 border-slate-200'
  //   return (
  //     <span
  //       className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
  //     >
  //       {s.replace('_', ' ')}
  //     </span>
  //   )
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Buy Credits
          </h1>
        </div>
        {error && (
          <div className="mb-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-[320px,1fr]">
          <Card className="self-start">
            <CardContent>
              <div className="text-gray-700 dark:text-gray-300">
                <div className="text-sm">Remaining Credits</div>
                <div className="text-3xl font-semibold">{credits ?? '—'}</div>
                <div className="mt-4">
                  <div className="text-sm">Last Bought</div>
                  <div className="text-lg font-medium">
                    {data?.currentSubscription?.plan?.name || 'None'}
                  </div>
                </div>
                {/* No status badge needed */}
              </div>
            </CardContent>
          </Card>

          <Card className="self-start">
            <CardHeader>
              <CardTitle>Available Credit Tiers</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-gray-500">Loading credit tiers…</div>
              ) : data?.plans && data.plans.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {data.plans.map((p) => {
                    const isCurrent = p.id === currentPlanId
                    return (
                      <div
                        key={p.id}
                        className="rounded-lg border p-5 bg-white/70 dark:bg-slate-900/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-lg font-semibold">{p.name}</div>
                          {isCurrent && (
                            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-800 border-slate-200">
                              LAST BOUGHT
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {(p.description || '—').replace(/\b[Pp]lan\b/g, 'tier')}
                        </div>
                        <div className="mt-3 flex items-center gap-4">
                          <div>
                            <div className="text-xs uppercase tracking-wide text-gray-500">
                              Credits
                            </div>
                            <div className="text-xl font-medium">
                              {p.credits}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs uppercase tracking-wide text-gray-500">
                              Price
                            </div>
                            <div className="text-xl font-medium">
                              {formatPrice(p.price)}
                            </div>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button
                            disabled={subscribing === p.id}
                            onClick={() => handleSubscribe(p.id)}
                            variant={'default'}
                            className="w-full"
                          >
                            {subscribing === p.id ? 'Redirecting…' : 'Buy'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500">No credit tiers available.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
