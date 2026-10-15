import type {
  Subscription,
  SubscriptionStatus,
} from "../../entities/subscription";

export interface UpsertSubscriptionData {
  companyId: string;
  lsSubscriptionId: string;
  lsCustomerId: string;
  variantId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
}

export interface SubscriptionRepository {
  findByCompanyId(companyId: string): Promise<Subscription | null>;
  upsert(data: UpsertSubscriptionData): Promise<Subscription>;
}
