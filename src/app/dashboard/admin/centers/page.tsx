import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { GetAllCentersUseCase } from "@/core/application/use-cases/admin/get-all-centers.use-case";
import CenterListView from "./_components/CenterListView";

export default async function AdminCentersPage() {
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

  const centerRepo = new SupabaseCenterRepository(supabase);
  const workerRepo = new SupabaseWorkerRepository(supabase);

  const useCase = new GetAllCentersUseCase(centerRepo, workerRepo);
  const centers = await useCase.execute(userData.companyId);

  return (
    <CenterListView
      centers={centers}
      companyId={userData.companyId}
      userRole={userData.role}
    />
  );
}
