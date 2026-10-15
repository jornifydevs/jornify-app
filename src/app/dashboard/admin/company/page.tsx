import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Country } from "country-state-city";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseCompanyRepository } from "@/infrastructure/supabase/repositories/supabase-company.repository";
import CompanyProfileView from "./_components/CompanyProfileView";

export default async function AdminCompanyPage() {
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

  const companyRepo = new SupabaseCompanyRepository(supabase);
  const company = await companyRepo.findById(userData.companyId);

  if (!company) {
    redirect("/dashboard");
  }

  let logoUrl: string | undefined;
  if (company.logo) {
    const { data: urlData } = supabase.storage
      .from("Avatars")
      .getPublicUrl(company.logo);
    logoUrl = urlData.publicUrl;
  }

  const countryOptions = Country.getAllCountries()
    .map((c) => ({ isoCode: c.isoCode, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <CompanyProfileView
      companyId={company.id}
      nif={company.nif}
      initialName={company.name}
      initialBusinessName={company.businessName}
      initialAddress={company.address}
      initialEmail={company.email}
      initialNationality={company.nationality ?? "ES"}
      countryOptions={countryOptions}
      initialLogoUrl={logoUrl}
    />
  );
}
