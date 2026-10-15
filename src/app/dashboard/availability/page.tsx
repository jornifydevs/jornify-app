import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import AvailabilityView from "./_components/AvailabilityView";

export default async function AvailabilityPage() {
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

  if (!userData) {
    redirect("/auth/login");
  }

  const workerRepo = new SupabaseWorkerRepository(supabase);
  const worker = await workerRepo.findByUserId(userData.id);

  if (!worker) {
    redirect("/dashboard");
  }

  const centerRepo = new SupabaseCenterRepository(supabase);
  const center = await centerRepo.findById(worker.centerId);

  return (
    <AvailabilityView
      workerId={worker.id}
      centerId={worker.centerId}
      userEmail={userData.email}
      enabledFeatures={center?.enabledFeatures ?? []}
      allowedDayTypes={center?.allowedDayTypes ?? []}
    />
  );
}
