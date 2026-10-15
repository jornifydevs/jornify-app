import type { SubscriptionRepository } from "@/core/domain/ports/repositories/subscription.repository";
import type { SubscriptionStatus } from "@/core/domain/entities/subscription";
import { ValidationError } from "@/core/domain/errors/domain-errors";

interface LemonSqueezyAttributes {
  customer_id: number;
  variant_id: number;
  status: string;
  renews_at: string | null;
  ends_at: string | null;
  trial_ends_at: string | null;
}

interface LemonSqueezyWebhookPayload {
  meta: {
    event_name: string;
    custom_data?: {
      company_id?: string;
    };
  };
  data: {
    id: string;
    attributes: LemonSqueezyAttributes;
  };
}

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: "active",
  on_trial: "on_trial",
  past_due: "past_due",
  paused: "paused",
  cancelled: "cancelled",
  expired: "expired",
};

const SUBSCRIPTION_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_resumed",
  "subscription_expired",
  "subscription_paused",
  "subscription_unpaused",
  "subscription_payment_failed",
  "subscription_payment_success",
]);

export class ProcessLemonSqueezyWebhookUseCase {
  constructor(private subscriptionRepo: SubscriptionRepository) {}

  async execute(payload: LemonSqueezyWebhookPayload): Promise<void> {
    const { event_name } = payload.meta;

    if (!SUBSCRIPTION_EVENTS.has(event_name)) return;

    const companyId = payload.meta.custom_data?.company_id;
    if (!companyId) {
      throw new ValidationError("Webhook sin company_id en custom_data");
    }

    const { id: lsSubscriptionId, attributes } = payload.data;
    const rawStatus = attributes.status;
    const status: SubscriptionStatus = STATUS_MAP[rawStatus] ?? "expired";

    const currentPeriodEnd =
      attributes.renews_at ??
      attributes.ends_at ??
      attributes.trial_ends_at ??
      null;

    await this.subscriptionRepo.upsert({
      companyId,
      lsSubscriptionId,
      lsCustomerId: String(attributes.customer_id),
      variantId: String(attributes.variant_id),
      status,
      currentPeriodEnd,
    });
  }
}
