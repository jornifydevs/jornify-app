import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseCompanyRepository } from "@/infrastructure/supabase/repositories/supabase-company.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { GetAllCompaniesUseCase } from "@/core/application/use-cases/super-admin/get-all-companies.use-case";
import Link from "next/link";
import { LogOut, Building2, ChevronRight, Shield } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function SuperAdminDashboard() {
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

  const getAllCompanies = new GetAllCompaniesUseCase(companyRepo);
  const companies = await getAllCompanies.execute();

  const centersCount = await centerRepo.countAll();

  const t = await getTranslations("superAdmin");
  const tc = await getTranslations("common");

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
              <Shield className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight">
                {t("title")}
              </h1>
              <p className="truncate text-sm text-muted-foreground">
                {userData.name} {userData.lastName}
              </p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <Button
              type="submit"
              variant="outline"
              aria-label={tc("signOut")}
              className="px-3 sm:px-5"
            >
              <LogOut />
              <span className="hidden sm:inline">{tc("signOut")}</span>
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="space-y-8">
          {/* Welcome */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("panelTitle")}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {t("panelDescription")}
            </p>
          </section>

          {/* Stats */}
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <dt className="text-sm text-muted-foreground">
                {t("companies")}
              </dt>
              <dd className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                {companies.length}
              </dd>
            </div>

            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <dt className="text-sm text-muted-foreground">
                {t("totalCenters")}
              </dt>
              <dd className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                {centersCount}
              </dd>
            </div>
          </dl>

          {/* Navigation */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Link
              href="/admin/companies"
              className="group flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-track">
                <Building2 className="size-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{t("companyManagement")}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("companyManagementDesc")}
                </p>
              </div>
              <ChevronRight
                className="mt-2.5 size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
