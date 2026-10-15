import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { SupabaseWorkdayRepository } from "@/infrastructure/supabase/repositories/supabase-workday.repository";
import { SupabaseWorkerScheduleTemplateRepository } from "@/infrastructure/supabase/repositories/supabase-worker-schedule-template.repository";
import { CENTER_FEATURES } from "@/core/domain/entities";
import AdminScheduleView from "../_components/AdminScheduleView";

interface Props {
  params: Promise<{ centerId: string }>;
}

export default async function AdminScheduleCenterPage({ params }: Props) {
  const { centerId } = await params;

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

  if (!userData || userData.role !== "admin" || !userData.companyId) {
    redirect("/dashboard");
  }

  const centerRepo = new SupabaseCenterRepository(supabase);
  const center = await centerRepo.findById(centerId);

  if (!center || !center.enabledFeatures.includes(CENTER_FEATURES.SCHEDULE)) {
    redirect("/dashboard/admin/schedule");
  }

  const workerRepo = new SupabaseWorkerRepository(supabase);
  const workers = await workerRepo.findByCenterId(centerId);
  const workerIds = workers.map((w) => w.id);

  const workdayRepo = new SupabaseWorkdayRepository(supabase);
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const toLocal = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const allWorkdays =
    workerIds.length > 0
      ? await workdayRepo.findByCenterAndDateRange(
          centerId,
          toLocal(monday),
          toLocal(sunday)
        )
      : [];

  const templateRepo = new SupabaseWorkerScheduleTemplateRepository(supabase);
  const initialTemplates =
    workerIds.length > 0 ? await templateRepo.findByWorkerIds(workerIds) : [];

  return (
    <AdminScheduleView
      centerId={centerId}
      centerName={center.name}
      center={center}
      adminUserId={user.id}
      workers={workers}
      initialWorkdays={allWorkdays}
      initialTemplates={initialTemplates}
    />
  );
}
