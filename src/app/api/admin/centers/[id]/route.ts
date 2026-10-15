import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/infrastructure/supabase/server";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { DeleteCenterUseCase } from "@/core/application/use-cases/admin/delete-center.use-case";
import { DomainError } from "@/core/domain/errors/domain-errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

async function getAdminUser(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const userRepo = new SupabaseUserRepository(supabase);
  return userRepo.findByEmail(user.email!);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const userData = await getAdminUser(supabase);

  if (!userData || userData.role !== "admin" || !userData.companyId) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const centerRepo = new SupabaseCenterRepository(supabase);
  const center = await centerRepo.findById(id);

  if (!center || center.companyId !== userData.companyId) {
    return NextResponse.json(
      { error: "Centro no encontrado" },
      { status: 404 }
    );
  }

  const body = await request.json();
  const { name, phone, address, location, email, nationality } = body;

  try {
    const updated = await centerRepo.update(id, {
      name,
      phone,
      address,
      location,
      email,
      nationality,
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof DomainError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Error al actualizar el centro" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const userData = await getAdminUser(supabase);

  if (!userData || userData.role !== "super_admin" || !userData.companyId) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  try {
    const centerRepo = new SupabaseCenterRepository(supabase);
    const workerRepo = new SupabaseWorkerRepository(supabase);
    const useCase = new DeleteCenterUseCase(centerRepo, workerRepo);

    await useCase.execute(id, userData.companyId);

    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof DomainError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Error al eliminar el centro" },
      { status: 500 }
    );
  }
}
