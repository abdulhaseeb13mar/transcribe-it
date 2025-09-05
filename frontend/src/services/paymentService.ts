import { apiClient } from './apiClient'

interface CheckoutResponse {
  checkoutUrl: string
  paymentId: string
}

// Admin listing types
export interface AdminPaymentPlanRef {
  id: string
  name: string
  credits: number
  price: string | number
}

export interface AdminPaymentOrgRef {
  id: string
  name: string
}

export interface AdminPaymentItem {
  id: string
  organizationId: string
  planId: string
  stripePaymentIntentId?: string | null
  stripeCheckoutSessionId?: string | null
  amount: number // in cents
  currency: string
  status: string // pending | succeeded | failed | expired | canceled
  createdAt: string
  updatedAt: string
  plan?: AdminPaymentPlanRef
  organization?: AdminPaymentOrgRef
}

export interface AdminPaymentsListResponse {
  payments: AdminPaymentItem[]
  count: number
  total: number
  page: number
  pageSize: number
  totalPages: number
}

class PaymentService {
  async createCheckout(planId: string) {
    return apiClient.post<CheckoutResponse>('/payments/checkout', { planId })
  }

  // Admin: fetch all payments with pagination
  async adminGetPayments(
    params?: Partial<{ page: number; pageSize: number; limit: number }>,
  ) {
    const qs = new URLSearchParams()
    if (params) {
      // Backend supports `page` and `limit` (or pageSize)
      if (params.page != null) qs.set('page', String(params.page))
      const limit = params.limit ?? params.pageSize
      if (limit != null) qs.set('limit', String(limit))
    }
    const url = `/admin/get-payments${qs.toString() ? `?${qs.toString()}` : ''}`
    return apiClient.get<AdminPaymentsListResponse>(url)
  }
}

export const paymentService = new PaymentService()
