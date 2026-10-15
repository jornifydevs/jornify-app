import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseSubscriptionRepository } from "@/infrastructure/supabase/repositories/supabase-subscription.repository";
import { GetSubscriptionUseCase } from "@/core/application/use-cases/billing/get-subscription.use-case";
import { config } from "@/config";
import BillingView from "./_components/BillingView";

export default async function AdminBillingPage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userRepo = new SupabaseUserRepository(supabase);
  const userData = await userRepo.findByEmail(user.email!);

  if (
    !userData ||
    (userData.role !== "admin" && userData.role !== "super_admin") ||
    !userData.companyId
  ) {
    redirect("/dashboard");
  }

  const subscriptionRepo = new SupabaseSubscriptionRepository(supabase);
  const getSubscription = new GetSubscriptionUseCase(subscriptionRepo);
  const subscription = await getSubscription.execute(userData.companyId);

  return (
    <BillingView
      subscription={subscription}
      variantId={config.lemonSqueezy.variantId}
    />
  );
}
