import { apiClient } from './apiClient'

interface CheckoutResponse {
  checkoutUrl: string
  paymentId: string
}

class PaymentService {
  async createCheckout(planId: string) {
    return apiClient.post<CheckoutResponse>('/payments/checkout', { planId })
  }
}

export const paymentService = new PaymentService()
