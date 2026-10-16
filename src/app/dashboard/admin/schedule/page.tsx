import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarClock, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
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
    <div>
      <div className="mx-auto max-w-4xl px-6 pt-6 lg:pt-8">
        <PageHeader title={t("pageTitle")} />
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {centers.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-card px-6 py-12 text-center shadow-sm">
            <CalendarClock
              className="size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("noScheduleFeature")}
            </p>
          </div>
        ) : (
          <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
            {centers.map((center) => (
              <li key={center.id}>
                <Link
                  href={`/dashboard/admin/schedule/${center.id}`}
                  className="group flex items-center gap-3 px-4 py-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
                >
                  <CalendarClock
                    className="size-5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{center.name}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {center.address}
                    </p>
                  </div>
                  <ChevronRight
                    className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
