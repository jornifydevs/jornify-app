import type {
  PaymentService,
  CheckoutSession,
} from "@/core/domain/ports/services/payment.service";
import { ValidationError } from "@/core/domain/errors/domain-errors";

export class CreateCheckoutSessionUseCase {
  constructor(private paymentService: PaymentService) {}

  async execute(
    variantId: string,
    companyId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSession> {
    if (!variantId) throw new ValidationError("variantId es obligatorio");
    if (!companyId) throw new ValidationError("companyId es obligatorio");

    return this.paymentService.createCheckoutSession(
      variantId,
      companyId,
      successUrl,
      cancelUrl
    );
  }
}
