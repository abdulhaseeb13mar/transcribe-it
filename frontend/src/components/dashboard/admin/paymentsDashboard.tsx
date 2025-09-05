import { useMemo } from 'react'
import { Card, CardContent } from '../../ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../ui/table'
import { Button } from '../../ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import type { AdminPaymentItem } from '@/services/paymentService'

export interface PaymentsDashboardProps {
  payments: AdminPaymentItem[]
  page: number
  pageSize: number
  total: number
  totalPages: number
  loading?: boolean
  error?: string | null
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onRefresh?: () => void
}

export function PaymentsDashboard({
  payments,
  page,
  pageSize,
  total,
  totalPages,
  loading,
  error,
  onPageChange,
  onPageSizeChange,
  onRefresh,
}: PaymentsDashboardProps) {
  const pageSizeOptions = useMemo(() => [10, 20, 50, 100], [])

  const formatCurrency = (amountCents: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(
      (amountCents || 0) / 100,
    )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Payments
        </h2>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button variant="outline" onClick={onRefresh} disabled={loading}>
              Refresh
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Created</TableHead>
                <TableHead>Organization</TableHead>
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
                    colSpan={6}
                    className="text-center text-gray-500 py-8"
                  >
                    Loading payments...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-red-600 py-8"
                  >
                    {error}
                  </TableCell>
                </TableRow>
              ) : payments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
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
                      {p.organization?.name ?? p.organizationId}
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

      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Page {page} of {Math.max(1, totalPages)} • {total.toLocaleString()}{' '}
          total
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">Rows:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => onPageSizeChange(Number(v))}
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
              onClick={() => onPageChange(1)}
              disabled={loading || page <= 1}
            >
              « First
            </Button>
            <Button
              variant="outline"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={loading || page <= 1}
            >
              ‹ Prev
            </Button>
            <Button
              variant="outline"
              onClick={() => onPageChange(Math.min(totalPages || 1, page + 1))}
              disabled={loading || page >= (totalPages || 1)}
            >
              Next ›
            </Button>
            <Button
              variant="outline"
              onClick={() => onPageChange(totalPages || 1)}
              disabled={loading || page >= (totalPages || 1)}
            >
              Last »
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
