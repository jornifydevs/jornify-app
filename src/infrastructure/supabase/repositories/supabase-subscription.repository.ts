import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Subscription,
  SubscriptionStatus,
} from "@/core/domain/entities/subscription";
import type {
  SubscriptionRepository,
  UpsertSubscriptionData,
} from "@/core/domain/ports/repositories/subscription.repository";

interface SubscriptionRow {
  id: string;
  company_id: string;
  ls_subscription_id: string;
  ls_customer_id: string;
  variant_id: string;
  status: string;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export class SupabaseSubscriptionRepository implements SubscriptionRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByCompanyId(companyId: string): Promise<Subscription | null> {
    const { data } = await this.supabase
      .from("subscription")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return data ? this.toDomain(data) : null;
  }

  async upsert(data: UpsertSubscriptionData): Promise<Subscription> {
    const { data: row, error } = await this.supabase
      .from("subscription")
      .upsert(
        {
          company_id: data.companyId,
          ls_subscription_id: data.lsSubscriptionId,
          ls_customer_id: data.lsCustomerId,
          variant_id: data.variantId,
          status: data.status,
          current_period_end: data.currentPeriodEnd,
        },
        { onConflict: "ls_subscription_id" }
      )
      .select()
      .single();

    if (error || !row) throw error ?? new Error("Error al guardar suscripción");
    return this.toDomain(row);
  }

  private toDomain(row: SubscriptionRow): Subscription {
    return {
      id: row.id,
      companyId: row.company_id,
      lsSubscriptionId: row.ls_subscription_id,
      lsCustomerId: row.ls_customer_id,
      variantId: row.variant_id,
      status: row.status as SubscriptionStatus,
      currentPeriodEnd: row.current_period_end,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
