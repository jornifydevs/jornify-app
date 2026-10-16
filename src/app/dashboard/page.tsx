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

export default async function Dashboard() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-6">
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-amber-500/50 p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
            Cuenta pendiente de activación
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-2">
            Tu cuenta de acceso se ha creado pero el perfil aún no está listo.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            Si acabas de confirmar tu email, espera unos segundos y recarga la
            página. Si el problema persiste, contacta con el administrador.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/dashboard"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Recargar
            </a>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors text-sm"
              >
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-6">
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-amber-500/50 p-8 max-w-md text-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
            Cuenta pendiente de asignación
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Tu cuenta ha sido creada correctamente. En breve, un administrador
            te asignará a tu centro de trabajo y completará tu perfil.
          </p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors text-sm"
            >
              Cerrar Sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Fetch center to get enabled features
  const center = workerData
    ? await centerRepo.findById(workerData.centerId)
    : null;

  const isAdmin = userData.role === "admin";

  const t = await getTranslations("dashboard.admin.pendingSetup");
  const tc = await getTranslations("common");

  if (isAdmin) {
    if (!userData.companyId) {
      return (
        <div className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center px-6">
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-amber-500/50 p-8 max-w-md text-center">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
              {t("title")}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              {t("message")}
            </p>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
              >
                {tc("signOut")}
              </button>
            </form>
          </div>
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
