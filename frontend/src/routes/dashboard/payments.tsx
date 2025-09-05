import { createFileRoute, redirect } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useSelector } from '@/store'
import { UserRole } from '@/types/enums'
import {
  paymentService,
  type AdminPaymentItem,
} from '@/services/paymentService'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { store } from '@/store'

export const Route = createFileRoute('/dashboard/payments')({
  beforeLoad: () => {
    const state = store.getState()
    const { isAuthenticated, user } = state.auth
    if (!isAuthenticated || !user || user.role !== UserRole.ADMIN) {
      throw redirect({ to: '/', search: { redirect: undefined } })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const user = useSelector((s) => s.auth.user)
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated)

  const [payments, setPayments] = useState<AdminPaymentItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pageSizeOptions = useMemo(() => [10, 20, 50, 100], [])

  const load = async (opts?: { page?: number; pageSize?: number }) => {
    if (!user?.organizationId) {
      setError('Organization not found for current user')
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)
      const p = opts?.page ?? page
      const l = opts?.pageSize ?? pageSize
      const res = await paymentService.getPaymentsByOrganization(
        user.organizationId,
        { page: p, pageSize: l },
      )
      if (res.success && res.data) {
        const d = res.data
        setPayments(d.payments)
        setTotal(d.total)
        setTotalPages(d.totalPages)
        setPage(d.page)
        setPageSize(d.pageSize)
      } else {
        setError(res.message || 'Failed to fetch payments')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only org admins should access
    if (!isAuthenticated || !user || user.role !== UserRole.ADMIN) {
      setError('Unauthorized')
      setLoading(false)
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id])

  const formatCurrency = (amountCents: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
      (amountCents || 0) / 100,
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Payments
          </h1>
          <div className="ml-auto">
            <Button variant="outline" onClick={() => load()} disabled={loading}>
              Refresh
            </Button>
          </div>
        </div>

        <Card className="self-start">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Created</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Stripe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-500 py-8"
                    >
                      Loading payments...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-red-600 py-8"
                    >
                      {error}
                    </TableCell>
                  </TableRow>
                ) : payments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-gray-500 py-8"
                    >
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {new Date(p.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {p.plan?.name ?? p.planId}
                          </span>
                          {p.plan ? (
                            <span className="text-xs text-gray-500">
                              {p.plan.credits.toLocaleString()} credits @{' '}
                              {(typeof p.plan.price === 'string'
                                ? Number(p.plan.price)
                                : p.plan.price
                              ).toLocaleString(undefined, {
                                style: 'currency',
                                currency: 'USD',
                              })}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(p.amount, p.currency.toUpperCase())}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            p.status === 'succeeded'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : p.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}
                        >
                          {p.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs max-w-[260px] truncate">
                          {p.stripeCheckoutSessionId ? (
                            <div className="truncate">
                              Session: {p.stripeCheckoutSessionId}
                            </div>
                          ) : null}
                          {p.stripePaymentIntentId ? (
                            <div className="truncate">
                              PI: {p.stripePaymentIntentId}
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4 mt-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {Math.max(1, totalPages)} • {total.toLocaleString()}{' '}
            total
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Rows:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  const size = Number(v)
                  setPageSize(size)
                  load({ page: 1, pageSize: size })
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder={String(pageSize)} />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((opt) => (
                    <SelectItem key={opt} value={String(opt)}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => load({ page: 1 })}
                disabled={loading || page <= 1}
              >
                « First
              </Button>
              <Button
                variant="outline"
                onClick={() => load({ page: Math.max(1, page - 1) })}
                disabled={loading || page <= 1}
              >
                ‹ Prev
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  load({ page: Math.min(totalPages || 1, page + 1) })
                }
                disabled={loading || page >= (totalPages || 1)}
              >
                Next ›
              </Button>
              <Button
                variant="outline"
                onClick={() => load({ page: totalPages || 1 })}
                disabled={loading || page >= (totalPages || 1)}
              >
                Last »
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
