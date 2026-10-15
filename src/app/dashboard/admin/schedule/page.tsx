import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarClock, ChevronRight } from "lucide-react";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { CENTER_FEATURES } from "@/core/domain/entities";
import { getTranslations } from "next-intl/server";

export default async function AdminSchedulePage() {
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

  const centerRepo = new SupabaseCenterRepository(supabase);
  const allCenters = await centerRepo.findByCompanyId(userData.companyId);
  const centers = allCenters.filter((c) =>
    c.enabledFeatures.includes(CENTER_FEATURES.SCHEDULE)
  );

  const t = await getTranslations("dashboard.admin.schedule");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-10 h-10 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-lg">
              <CalendarClock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("pageTitle")}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {centers.length === 0 ? (
          <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {t("noScheduleFeature")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {centers.map((center) => (
              <Link
                key={center.id}
                href={`/dashboard/admin/schedule/${center.id}`}
                className="flex items-center justify-between p-5 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-600/10 rounded-lg group-hover:bg-orange-600/20 transition-colors">
                    <CalendarClock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {center.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {center.address}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-orange-500 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
