import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { CENTER_FEATURES } from "@/core/domain/entities";
import WorkerScheduleView from "./_components/WorkerScheduleView";

export default async function SchedulePage() {
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

  if (!center?.enabledFeatures.includes(CENTER_FEATURES.SCHEDULE)) {
    redirect("/dashboard");
  }

  return <WorkerScheduleView workerId={worker.id} centerId={worker.centerId} />;
}
