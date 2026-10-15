import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { SupabaseDocumentRepository } from "@/infrastructure/supabase/repositories/supabase-document.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { GetWorkerDocumentsUseCase } from "@/core/application/use-cases/payroll/get-worker-documents.use-case";
import PayrollView from "./_components/PayrollView";

export default async function PayrollPage() {
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

  const documentRepo = new SupabaseDocumentRepository(supabase);
  const getDocumentsUseCase = new GetWorkerDocumentsUseCase(documentRepo);
  const documents = await getDocumentsUseCase.execute(worker.id);

  return (
    <PayrollView
      documents={documents}
      userEmail={userData.email}
      enabledFeatures={center?.enabledFeatures ?? []}
    />
  );
}
