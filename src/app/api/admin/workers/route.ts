import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/infrastructure/supabase/server";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { AssignWorkerUseCase } from "@/core/application/use-cases/admin/assign-worker.use-case";
import { DomainError } from "@/core/domain/errors/domain-errors";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const userRepo = new SupabaseUserRepository(supabase);
  const userData = await userRepo.findByEmail(user.email!);

  if (!userData || userData.role !== "admin" || !userData.companyId) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  const body = await request.json();
  const { userId, centerId, dni, contractType, hourWeek, job } = body ?? {};

  if (!userId || !centerId || !dni || !contractType || !hourWeek || !job) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios" },
      { status: 400 }
    );
  }

  try {
    const workerRepo = new SupabaseWorkerRepository(supabase);
    const useCase = new AssignWorkerUseCase(workerRepo);
    const worker = await useCase.execute({
      userId,
      centerId,
      dni,
      contractType,
      hourWeek: Number(hourWeek),
      job,
    });
    return NextResponse.json(worker, { status: 201 });
  } catch (err) {
    if (err instanceof DomainError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    console.error("[POST /api/admin/workers]", err);
    return NextResponse.json(
      { error: "Error al asignar el trabajador" },
      { status: 500 }
    );
  }
}
