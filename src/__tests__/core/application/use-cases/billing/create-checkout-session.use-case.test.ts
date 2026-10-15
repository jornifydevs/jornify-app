import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateCheckoutSessionUseCase } from "@/core/application/use-cases/billing/create-checkout-session.use-case";
import type {
  PaymentService,
  CheckoutSession,
} from "@/core/domain/ports/services/payment.service";
import { ValidationError } from "@/core/domain/errors/domain-errors";

const mockSession: CheckoutSession = {
  url: "https://checkout.lemonsqueezy.com/buy/test",
};

describe("CreateCheckoutSessionUseCase", () => {
  let paymentService: PaymentService;
  let useCase: CreateCheckoutSessionUseCase;

  beforeEach(() => {
    paymentService = {
      createCheckoutSession: vi.fn(),
    };
    useCase = new CreateCheckoutSessionUseCase(paymentService);
  });

  it("devuelve la URL de checkout cuando los parámetros son válidos", async () => {
    vi.mocked(paymentService.createCheckoutSession).mockResolvedValue(
      mockSession
    );

    const result = await useCase.execute(
      "variant-123",
      "company-abc",
      "https://app.example.com/success",
      "https://app.example.com/cancel"
    );

    expect(result).toEqual(mockSession);
    expect(paymentService.createCheckoutSession).toHaveBeenCalledWith(
      "variant-123",
      "company-abc",
      "https://app.example.com/success",
      "https://app.example.com/cancel"
    );
  });

  it("lanza ValidationError si variantId está vacío", async () => {
    await expect(
      useCase.execute(
        "",
        "company-abc",
        "https://success.com",
        "https://cancel.com"
      )
    ).rejects.toThrow(ValidationError);
  });

  it("lanza ValidationError si companyId está vacío", async () => {
    await expect(
      useCase.execute(
        "variant-123",
        "",
        "https://success.com",
        "https://cancel.com"
      )
    ).rejects.toThrow(ValidationError);
  });

  it("propaga errores del servicio de pago", async () => {
    vi.mocked(paymentService.createCheckoutSession).mockRejectedValue(
      new Error("API error")
    );

    await expect(
      useCase.execute(
        "variant-123",
        "company-abc",
        "https://success.com",
        "https://cancel.com"
      )
    ).rejects.toThrow("API error");
  });
});
