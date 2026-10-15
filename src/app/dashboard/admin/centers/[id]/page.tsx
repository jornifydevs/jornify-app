import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { State, Country } from "country-state-city";
import {
  SUBDIVISION_OVERRIDES,
  SUBDIVISION_NAMES,
} from "@/lib/subdivision-names";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import CenterScheduleForm from "./_components/CenterScheduleForm";

interface CenterDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CenterDetailPage({
  params,
}: CenterDetailPageProps) {
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

  if (
    !userData ||
    (userData.role !== "admin" && userData.role !== "super_admin") ||
    !userData.companyId
  ) {
    redirect("/dashboard");
  }

  const centerRepo = new SupabaseCenterRepository(supabase);
  const center = await centerRepo.findById(id);

  if (!center || center.companyId !== userData.companyId) {
    redirect("/dashboard/admin/centers");
  }

  const nationality = center.nationality ?? "ES";

  const subdivisions =
    SUBDIVISION_OVERRIDES[nationality] ??
    (() => {
      const nameOverrides = SUBDIVISION_NAMES[nationality] ?? {};
      return State.getStatesOfCountry(nationality).map((s) => ({
        code: `${nationality}-${s.isoCode}`,
        name: nameOverrides[s.isoCode] ?? s.name,
      }));
    })();

  const countryOptions = Country.getAllCountries()
    .map((c) => ({ isoCode: c.isoCode, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <CenterScheduleForm
      center={center}
      userRole={userData.role}
      subdivisions={subdivisions}
      countryOptions={countryOptions}
    />
  );
}
