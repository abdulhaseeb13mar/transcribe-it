import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { PaymentsDashboard } from '@/components/dashboard/admin/paymentsDashboard'
import {
  paymentService,
  type AdminPaymentItem,
} from '@/services/paymentService'

// Note: cast path to any to avoid transient type errors before route tree regen
export const Route = createFileRoute('/admin/dashboard/payments/' as any)({
  component: PaymentsRoute,
})

function PaymentsRoute() {
  const [payments, setPayments] = useState<AdminPaymentItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPayments = async (opts?: { page?: number; pageSize?: number }) => {
    try {
      setLoading(true)
      setError(null)
      const p = opts?.page ?? page
      const l = opts?.pageSize ?? pageSize
      const res = await paymentService.adminGetPayments({
        page: p,
        pageSize: l,
      })
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
    } catch (err) {
      console.error('Error fetching payments:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <PaymentsDashboard
      payments={payments}
      page={page}
      pageSize={pageSize}
      total={total}
      totalPages={totalPages}
      loading={loading}
      error={error}
      onPageChange={(p) => fetchPayments({ page: p })}
      onPageSizeChange={(s) => fetchPayments({ page: 1, pageSize: s })}
      onRefresh={() => fetchPayments()}
    />
  )
}
