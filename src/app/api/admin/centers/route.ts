import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/infrastructure/supabase/server";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { CreateCenterUseCase } from "@/core/application/use-cases/admin/create-center.use-case";
import { DomainError } from "@/core/domain/errors/domain-errors";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const userRepo = new SupabaseUserRepository(supabase);
  const userData = await userRepo.findByEmail(user.email!);

  if (!userData || userData.role !== "admin" || !userData.companyId) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const body = await request.json();
  const { name, phone, address, location, email } = body;

  try {
    const centerRepo = new SupabaseCenterRepository(supabase);
    const useCase = new CreateCenterUseCase(centerRepo);

    const center = await useCase.execute({
      companyId: userData.companyId,
      name,
      phone,
      address,
      location,
      email,
    });

    return NextResponse.json(center, { status: 201 });
  } catch (e) {
    if (e instanceof DomainError) {
      return NextResponse.json({ error: e.message }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Error al crear el centro" },
      { status: 500 }
    );
  }
}
