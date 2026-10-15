export interface CheckoutSession {
  url: string;
}

export interface PaymentService {
  createCheckoutSession(
    variantId: string,
    companyId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSession>;
}
