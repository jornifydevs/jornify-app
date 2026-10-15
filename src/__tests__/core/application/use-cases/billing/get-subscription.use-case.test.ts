import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetSubscriptionUseCase } from "@/core/application/use-cases/billing/get-subscription.use-case";
import type { SubscriptionRepository } from "@/core/domain/ports/repositories/subscription.repository";
import type { Subscription } from "@/core/domain/entities/subscription";

const mockSubscription: Subscription = {
  id: "sub-1",
  companyId: "company-abc",
  lsSubscriptionId: "ls-sub-999",
  lsCustomerId: "ls-cust-123",
  variantId: "variant-456",
  status: "active",
  currentPeriodEnd: "2026-05-26T00:00:00Z",
  createdAt: "2026-04-01T00:00:00Z",
  updatedAt: "2026-04-01T00:00:00Z",
};

describe("GetSubscriptionUseCase", () => {
  let subscriptionRepo: SubscriptionRepository;
  let useCase: GetSubscriptionUseCase;

  beforeEach(() => {
    subscriptionRepo = {
      findByCompanyId: vi.fn(),
      upsert: vi.fn(),
    };
    useCase = new GetSubscriptionUseCase(subscriptionRepo);
  });

  it("devuelve la suscripción cuando existe", async () => {
    vi.mocked(subscriptionRepo.findByCompanyId).mockResolvedValue(
      mockSubscription
    );

    const result = await useCase.execute("company-abc");

    expect(result).toEqual(mockSubscription);
    expect(subscriptionRepo.findByCompanyId).toHaveBeenCalledWith(
      "company-abc"
    );
  });

  it("devuelve null cuando no hay suscripción", async () => {
    vi.mocked(subscriptionRepo.findByCompanyId).mockResolvedValue(null);

    const result = await useCase.execute("company-xyz");

    expect(result).toBeNull();
  });
});
