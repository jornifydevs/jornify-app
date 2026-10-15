import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseCompanyRepository } from "@/infrastructure/supabase/repositories/supabase-company.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import CompanyDetailView from "./_components/CompanyDetailView";

interface CompanyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({
  params,
}: CompanyDetailPageProps) {
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

  if (!userData || userData.role !== "super_admin") {
    redirect("/dashboard");
  }

  const companyRepo = new SupabaseCompanyRepository(supabase);
  const centerRepo = new SupabaseCenterRepository(supabase);
  const workerRepo = new SupabaseWorkerRepository(supabase);

  const company = await companyRepo.findById(id);
  if (!company) {
    redirect("/admin/companies");
  }

  const centers = await centerRepo.findByCompanyId(id);

  const centersWithWorkers = await Promise.all(
    centers.map(async (center) => {
      const workers = await workerRepo.findByCenterId(center.id);
      return { ...center, workerCount: workers.length };
    })
  );

  return <CompanyDetailView company={company} centers={centersWithWorkers} />;
}
