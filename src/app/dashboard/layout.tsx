import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { SupabaseCompanyRepository } from "@/infrastructure/supabase/repositories/supabase-company.repository";
import { AdminShell } from "./_components/AdminShell";
import { WorkerTabBar } from "./_components/WorkerTabBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Pages handle the redirects; accounts that are not set up yet get no shell.
  if (!user?.email) return children;

  const profile = await new SupabaseUserRepository(supabase).findByEmail(
    user.email
  );
  if (!profile) return children;

  if (profile.role === "admin" && profile.companyId) {
    const company = await new SupabaseCompanyRepository(supabase).findById(
      profile.companyId
    );
    return (
      <AdminShell
        companyName={company?.name ?? ""}
        userName={`${profile.name} ${profile.lastName}`}
      >
        {children}
      </AdminShell>
    );
  }

  if (profile.role === "worker") {
    const worker = await new SupabaseWorkerRepository(supabase).findByUserId(
      profile.id
    );
    if (worker) {
      const center = await new SupabaseCenterRepository(supabase).findById(
        worker.centerId
      );
      return (
        <div className="flex flex-1 flex-col pb-28">
          {children}
          <WorkerTabBar enabledFeatures={center?.enabledFeatures ?? []} />
        </div>
      );
    }
  }

  return children;
}
