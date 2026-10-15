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
    <div className="flex flex-1 flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t("title")}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {userData.name} {userData.lastName}
              </p>
            </div>
          </div>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{tc("signOut")}</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1">
        <div className="space-y-8">
          {/* Welcome */}
          <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-500/50 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {t("panelTitle")}
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              {t("panelDescription")}
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/20 rounded-lg">
                  <Building2 className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("companies")}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {companies.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-600/20 rounded-lg">
                  <Building2 className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("totalCenters")}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {centersCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <Link
            href="/admin/companies"
            className="group flex items-start justify-between bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-500/30 p-6 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all"
          >
            <div>
              <div className="p-3 bg-blue-600/20 rounded-lg inline-block mb-4">
                <Building2 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                {t("companyManagement")}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("companyManagementDesc")}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 dark:text-slate-500 dark:group-hover:text-white transition-colors mt-3" />
          </Link>
        </div>
      </main>
    </div>
  );
}
