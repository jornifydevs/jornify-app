import { createClient } from "@/infrastructure/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { SupabaseWorkdayRepository } from "@/infrastructure/supabase/repositories/supabase-workday.repository";
import { SupabaseDocumentRepository } from "@/infrastructure/supabase/repositories/supabase-document.repository";
import { GetAdminDashboardUseCase } from "@/core/application/use-cases/dashboard/get-admin-dashboard.use-case";
import { GetWorkerDashboardUseCase } from "@/core/application/use-cases/dashboard/get-worker-dashboard.use-case";
import AdminDashboard from "./_components/AdminDashboard";
import WorkerDashboard from "./_components/WorkerDashboard";
import { getTranslations } from "next-intl/server";
import { Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function Dashboard() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const tp = await getTranslations("dashboard.pending");
  const tc = await getTranslations("common");

  // Create repositories
  const userRepo = new SupabaseUserRepository(supabase);
  const workerRepo = new SupabaseWorkerRepository(supabase);
  const centerRepo = new SupabaseCenterRepository(supabase);
  const workdayRepo = new SupabaseWorkdayRepository(supabase);
  const documentRepo = new SupabaseDocumentRepository(supabase);

  // Get user data to determine role
  const userData = await userRepo.findByEmail(user.email!);
  if (!userData) {
    // User has a valid auth session but no profile record yet.
    // Redirecting to /auth/login would create an infinite loop because the
    // middleware lets authenticated users through. Show a pending page instead.
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <Card className="w-full max-w-md p-6 text-center sm:p-8">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
            <Hourglass className="size-6" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-xl font-semibold tracking-tight">
            {tp("profile.title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{tp("profile.message")}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {tp("profile.hint")}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <a href="/dashboard">{tp("reload")}</a>
            </Button>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" className="w-full">
                {tc("signOut")}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    );
  }

  // Super admins get redirected to their own dashboard
  if (userData.role === "super_admin") {
    redirect("/admin");
  }

  // Get worker data
  const getWorkerDashboard = new GetWorkerDashboardUseCase(
    userRepo,
    workerRepo
  );

  let workerData;
  try {
    const result = await getWorkerDashboard.execute(user.email!);
    workerData = result.worker;
  } catch {
    // User exists but no worker record — treat as admin
  }

  // Worker user with no worker record yet — waiting for admin to assign them
  if (userData.role === "worker" && !workerData) {
    return (
      <div className="flex flex-1 items-center justify-center px-5 py-12">
        <Card className="w-full max-w-md p-6 text-center sm:p-8">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
            <Hourglass className="size-6" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-xl font-semibold tracking-tight">
            {tp("assignment.title")}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {tp("assignment.message")}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline" className="w-full">
                {tc("signOut")}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    );
  }

  // Fetch center to get enabled features
  const center = workerData
    ? await centerRepo.findById(workerData.centerId)
    : null;

  const isAdmin = userData.role === "admin";

  const t = await getTranslations("dashboard.admin.pendingSetup");

  if (isAdmin) {
    if (!userData.companyId) {
      return (
        <div className="flex flex-1 items-center justify-center px-5 py-12">
          <Card className="w-full max-w-md p-6 text-center sm:p-8">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand-soft text-brand-text">
              <Hourglass className="size-6" aria-hidden="true" />
            </div>
            <h1 className="mt-5 text-xl font-semibold tracking-tight">
              {t("title")}
            </h1>
            <p className="mt-2 text-muted-foreground">{t("message")}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <form action="/auth/signout" method="post">
                <Button type="submit" variant="outline" className="w-full">
                  {tc("signOut")}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      );
    }

    const getAdminDashboard = new GetAdminDashboardUseCase(
      workerRepo,
      centerRepo,
      workdayRepo
    );
    const stats = await getAdminDashboard.execute();

    return (
      <AdminDashboard
        userName={userData.name}
        userLastName={userData.lastName}
        totalWorkers={stats.totalWorkers}
        totalCenters={stats.totalCenters}
        activeToday={stats.activeToday}
      />
    );
  }

  const userImg = await documentRepo.findAvatarUrlByWorkerId(workerData!.id);

  return (
    <WorkerDashboard
      userName={userData.name}
      userLastName={userData.lastName}
      userImg={userImg}
      workerJob={workerData!.job}
      userId={user.id}
      workerId={workerData!.id}
      enabledFeatures={center?.enabledFeatures ?? []}
    />
  );
}
