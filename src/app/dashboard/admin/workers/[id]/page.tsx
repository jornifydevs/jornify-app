import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { SupabaseWorkdayRepository } from "@/infrastructure/supabase/repositories/supabase-workday.repository";
import { SupabaseTimeRecordRepository } from "@/infrastructure/supabase/repositories/supabase-time-record.repository";
import { SupabaseDocumentRepository } from "@/infrastructure/supabase/repositories/supabase-document.repository";
import { SupabaseCompanyRepository } from "@/infrastructure/supabase/repositories/supabase-company.repository";
import { GetWorkerDetailUseCase } from "@/core/application/use-cases/admin/get-worker-detail.use-case";
import WorkerDetailView from "./_components/WorkerDetailView";

interface WorkerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkerDetailPage({
  params,
}: WorkerDetailPageProps) {
  const { id } = await params;
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
  const workdayRepo = new SupabaseWorkdayRepository(supabase);
  const timeRecordRepo = new SupabaseTimeRecordRepository(supabase);
  const documentRepo = new SupabaseDocumentRepository(supabase);

  const useCase = new GetWorkerDetailUseCase(
    workerRepo,
    userRepo,
    centerRepo,
    workdayRepo,
    timeRecordRepo
  );

  const companyRepo = new SupabaseCompanyRepository(supabase);

  try {
    const [detail, centers, company] = await Promise.all([
      useCase.execute(id, userData.companyId),
      centerRepo.findByCompanyId(userData.companyId),
      companyRepo.findById(userData.companyId),
    ]);
    const userImg = await documentRepo.findAvatarUrlByWorkerId(
      detail.worker.id
    );

    const registroMeta = company
      ? {
          workerName: detail.userName,
          workerLastName: detail.userLastName,
          workerDni: detail.worker.dni,
          workerNss: detail.worker.nss,
          companyName: company.businessName || company.name,
          companyNif: company.nif,
          companyCCC: company.codigoCuentaCotizacion,
        }
      : undefined;

    return (
      <WorkerDetailView
        detail={{ ...detail, userImg }}
        centers={centers}
        registroMeta={registroMeta}
      />
    );
  } catch {
    redirect("/dashboard/admin/workers");
  }
}
