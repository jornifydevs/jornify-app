import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { SupabaseInvitationCodeRepository } from "@/infrastructure/supabase/repositories/supabase-invitation-code.repository";
import { GetAllWorkersUseCase } from "@/core/application/use-cases/admin/get-all-workers.use-case";
import { GetInvitationCodesUseCase } from "@/core/application/use-cases/admin/get-invitation-codes.use-case";
import { GetUnassignedWorkersUseCase } from "@/core/application/use-cases/admin/get-unassigned-workers.use-case";
import WorkerListView from "./_components/WorkerListView";

export default async function AdminWorkersPage() {
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

  const workerRepo = new SupabaseWorkerRepository(supabase);
  const centerRepo = new SupabaseCenterRepository(supabase);
  const invitationCodeRepo = new SupabaseInvitationCodeRepository(supabase);

  const [workers, invitationCodes, unassignedWorkers, centers] =
    await Promise.all([
      new GetAllWorkersUseCase(workerRepo, userRepo, centerRepo).execute(
        userData.companyId
      ),
      new GetInvitationCodesUseCase(invitationCodeRepo).execute(
        userData.companyId
      ),
      new GetUnassignedWorkersUseCase(userRepo, workerRepo, centerRepo).execute(
        userData.companyId
      ),
      centerRepo.findByCompanyId(userData.companyId),
    ]);

  return (
    <WorkerListView
      workers={workers}
      initialCodes={invitationCodes}
      unassignedWorkers={unassignedWorkers}
      centers={centers}
    />
  );
}
