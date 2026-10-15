export type SubscriptionStatus =
  | "active"
  | "on_trial"
  | "past_due"
  | "paused"
  | "cancelled"
  | "expired";

export interface Subscription {
  id: string;
  companyId: string;
  lsSubscriptionId: string;
  lsCustomerId: string;
  variantId: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}
