import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProcessLemonSqueezyWebhookUseCase } from "@/core/application/use-cases/billing/process-lemon-squeezy-webhook.use-case";
import type { SubscriptionRepository } from "@/core/domain/ports/repositories/subscription.repository";
import type { Subscription } from "@/core/domain/entities/subscription";
import { ValidationError } from "@/core/domain/errors/domain-errors";

const mockSubscription: Subscription = {
  id: "sub-1",
  companyId: "company-abc",
  lsSubscriptionId: "ls-sub-999",
  lsCustomerId: "12345",
  variantId: "67890",
  status: "active",
  currentPeriodEnd: "2026-05-26T00:00:00Z",
  createdAt: "2026-04-01T00:00:00Z",
  updatedAt: "2026-04-01T00:00:00Z",
};

const buildPayload = (overrides: Record<string, unknown> = {}) => ({
  meta: {
    event_name: "subscription_created",
    custom_data: { company_id: "company-abc" },
    ...overrides,
  },
  data: {
    id: "ls-sub-999",
    attributes: {
      customer_id: 12345,
      variant_id: 67890,
      status: "active",
      renews_at: "2026-05-26T00:00:00Z",
      ends_at: null,
      trial_ends_at: null,
    },
  },
});

describe("ProcessLemonSqueezyWebhookUseCase", () => {
  let subscriptionRepo: SubscriptionRepository;
  let useCase: ProcessLemonSqueezyWebhookUseCase;

  beforeEach(() => {
    subscriptionRepo = {
      findByCompanyId: vi.fn(),
      upsert: vi.fn(),
    };
    useCase = new ProcessLemonSqueezyWebhookUseCase(subscriptionRepo);
  });

  it("hace upsert de la suscripción en evento subscription_created", async () => {
    vi.mocked(subscriptionRepo.upsert).mockResolvedValue(mockSubscription);

    await useCase.execute(buildPayload());

    expect(subscriptionRepo.upsert).toHaveBeenCalledWith({
      companyId: "company-abc",
      lsSubscriptionId: "ls-sub-999",
      lsCustomerId: "12345",
      variantId: "67890",
      status: "active",
      currentPeriodEnd: "2026-05-26T00:00:00Z",
    });
  });

  it("ignora eventos que no son de suscripción", async () => {
    await useCase.execute(buildPayload({ event_name: "order_created" }));

    expect(subscriptionRepo.upsert).not.toHaveBeenCalled();
  });

  it("lanza ValidationError si falta company_id en custom_data", async () => {
    const payload = buildPayload({ custom_data: {} });

    await expect(useCase.execute(payload)).rejects.toThrow(ValidationError);
  });

  it("lanza ValidationError si custom_data está ausente", async () => {
    const payload = buildPayload({ custom_data: undefined });

    await expect(useCase.execute(payload)).rejects.toThrow(ValidationError);
  });

  it("mapea correctamente el estado cancelled", async () => {
    vi.mocked(subscriptionRepo.upsert).mockResolvedValue({
      ...mockSubscription,
      status: "cancelled",
    });

    const payload = {
      meta: {
        event_name: "subscription_cancelled",
        custom_data: { company_id: "company-abc" },
      },
      data: {
        id: "ls-sub-999",
        attributes: {
          customer_id: 12345,
          variant_id: 67890,
          status: "cancelled",
          renews_at: null,
          ends_at: "2026-05-26T00:00:00Z",
          trial_ends_at: null,
        },
      },
    };

    await useCase.execute(payload);

    expect(subscriptionRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "cancelled" })
    );
  });

  it("usa ends_at como currentPeriodEnd si renews_at es null", async () => {
    vi.mocked(subscriptionRepo.upsert).mockResolvedValue(mockSubscription);

    const payload = {
      meta: {
        event_name: "subscription_updated",
        custom_data: { company_id: "company-abc" },
      },
      data: {
        id: "ls-sub-999",
        attributes: {
          customer_id: 12345,
          variant_id: 67890,
          status: "active",
          renews_at: null,
          ends_at: "2026-06-01T00:00:00Z",
          trial_ends_at: null,
        },
      },
    };

    await useCase.execute(payload);

    expect(subscriptionRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ currentPeriodEnd: "2026-06-01T00:00:00Z" })
    );
  });

  it("mapea estado desconocido a 'expired'", async () => {
    vi.mocked(subscriptionRepo.upsert).mockResolvedValue({
      ...mockSubscription,
      status: "expired",
    });

    const payload = {
      ...buildPayload(),
      data: {
        id: "ls-sub-999",
        attributes: {
          customer_id: 12345,
          variant_id: 67890,
          status: "unknown_status",
          renews_at: null,
          ends_at: null,
          trial_ends_at: null,
        },
      },
    };

    await useCase.execute(payload);

    expect(subscriptionRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: "expired" })
    );
  });
});
