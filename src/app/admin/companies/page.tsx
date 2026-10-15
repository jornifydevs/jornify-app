import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseCompanyRepository } from "@/infrastructure/supabase/repositories/supabase-company.repository";
import { GetAllCompaniesUseCase } from "@/core/application/use-cases/super-admin/get-all-companies.use-case";
import CompanyListView from "./_components/CompanyListView";

export default async function CompaniesPage() {
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
  const getAllCompanies = new GetAllCompaniesUseCase(companyRepo);
  const companies = await getAllCompanies.execute();

  return <CompanyListView companies={companies} />;
}
