import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { SupabaseCompanyRepository } from "@/infrastructure/supabase/repositories/supabase-company.repository";
import HistoryView from "./_components/HistoryView";

export default async function HistoryPage() {
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

  let registroMeta = undefined;
  const companyId = userData.companyId ?? center?.companyId;
  if (companyId) {
    const companyRepo = new SupabaseCompanyRepository(supabase);
    const company = await companyRepo.findById(companyId);
    if (company) {
      registroMeta = {
        workerName: userData.name,
        workerLastName: userData.lastName,
        workerDni: userData.dni ?? worker.dni,
        workerNss: worker.nss,
        companyName: company.businessName || company.name,
        companyNif: company.nif,
        companyCCC: company.codigoCuentaCotizacion,
      };
    }
  }

  return <HistoryView workerId={worker.id} registroMeta={registroMeta} />;
}
