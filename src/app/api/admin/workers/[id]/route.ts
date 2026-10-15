import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/infrastructure/supabase/server";
import { createAdminClient } from "@/infrastructure/supabase/admin";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { SupabaseDocumentRepository } from "@/infrastructure/supabase/repositories/supabase-document.repository";
import { SupabaseWorkdayRepository } from "@/infrastructure/supabase/repositories/supabase-workday.repository";
import { SupabaseTimeRecordRepository } from "@/infrastructure/supabase/repositories/supabase-time-record.repository";
import { MoveWorkerUseCase } from "@/core/application/use-cases/admin/move-worker.use-case";
import { FullDeleteWorkerUseCase } from "@/core/application/use-cases/admin/full-delete-worker.use-case";
import { DomainError } from "@/core/domain/errors/domain-errors";

async function getAdminContext() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const userRepo = new SupabaseUserRepository(supabase);
  const userData = await userRepo.findByEmail(user.email!);

  if (!userData || userData.role !== "admin" || !userData.companyId) {
    return null;
  }

  return { supabase, userData };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminContext();
  if (!ctx) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  let centerId: string;
  try {
    const body = await request.json();
    centerId = body?.centerId;
    if (!centerId) throw new Error();
  } catch {
    return NextResponse.json(
      { error: "centerId es obligatorio" },
      { status: 400 }
    );
  }

  // Verify the target center belongs to the admin's company
  const centerRepo = new SupabaseCenterRepository(ctx.supabase);
  const companyCenters = await centerRepo.findByCompanyId(
    ctx.userData.companyId!
  );
  const centerBelongsToCompany = companyCenters.some((c) => c.id === centerId);
  if (!centerBelongsToCompany) {
    return NextResponse.json(
      { error: "Centro no encontrado" },
      { status: 404 }
    );
  }

  const workerRepo = new SupabaseWorkerRepository(ctx.supabase);
  const useCase = new MoveWorkerUseCase(workerRepo);

  try {
    const worker = await useCase.execute(id, centerId);
    return NextResponse.json(worker);
  } catch (e) {
    const message =
      e instanceof DomainError ? e.message : "Error al mover el trabajador";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminContext();
  if (!ctx) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const workerRepo = new SupabaseWorkerRepository(ctx.supabase);
  const documentRepo = new SupabaseDocumentRepository(ctx.supabase);
  const workdayRepo = new SupabaseWorkdayRepository(ctx.supabase);
  const timeRecordRepo = new SupabaseTimeRecordRepository(ctx.supabase);
  const userRepo = new SupabaseUserRepository(ctx.supabase);

  const useCase = new FullDeleteWorkerUseCase(
    workerRepo,
    documentRepo,
    workdayRepo,
    timeRecordRepo,
    userRepo
  );

  try {
    const authUserId = await useCase.execute(id);

    // Delete from auth.users — requires service role key
    const adminSupabase = createAdminClient();
    const { error: authError } =
      await adminSupabase.auth.admin.deleteUser(authUserId);
    if (authError) {
      console.error("Error deleting auth user:", authError.message);
      // Do not block the response — data is already deleted from the app tables
    }

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    const message =
      e instanceof DomainError ? e.message : "Error al eliminar el trabajador";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
