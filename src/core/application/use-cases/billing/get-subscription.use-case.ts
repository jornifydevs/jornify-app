import type { SubscriptionRepository } from "@/core/domain/ports/repositories/subscription.repository";
import type { Subscription } from "@/core/domain/entities/subscription";

export class GetSubscriptionUseCase {
  constructor(private subscriptionRepo: SubscriptionRepository) {}

  async execute(companyId: string): Promise<Subscription | null> {
    return this.subscriptionRepo.findByCompanyId(companyId);
  }
}
