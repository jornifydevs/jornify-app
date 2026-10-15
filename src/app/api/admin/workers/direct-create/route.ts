import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/infrastructure/supabase/server";
import { createAdminClient } from "@/infrastructure/supabase/admin";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { AssignWorkerUseCase } from "@/core/application/use-cases/admin/assign-worker.use-case";
import { DomainError } from "@/core/domain/errors/domain-errors";

export async function POST(request: Request) {
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
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: {
    name: string;
    lastName: string;
    email: string;
    phone?: string;
    dni?: string;
    centerId?: string;
    contractType?: string;
    hourWeek?: number;
    job?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const {
    name,
    lastName,
    email,
    phone,
    dni,
    centerId,
    contractType,
    hourWeek,
    job,
  } = body;

  if (!name || !lastName || !email) {
    return NextResponse.json(
      { error: "Faltan campos obligatorios" },
      { status: 400 }
    );
  }

  // If centerId is provided, validate worker-specific fields and center ownership
  if (centerId) {
    if (!dni || !contractType || !hourWeek || !job) {
      return NextResponse.json(
        {
          error: "Faltan campos del trabajador (DNI, puesto, contrato, horas)",
        },
        { status: 400 }
      );
    }
    const centerRepo = new SupabaseCenterRepository(supabase);
    const companyCenters = await centerRepo.findByCompanyId(userData.companyId);
    if (!companyCenters.some((c) => c.id === centerId)) {
      return NextResponse.json(
        { error: "Centro no encontrado" },
        { status: 404 }
      );
    }
  }

  const adminClient = createAdminClient();

  // Create auth user and send invitation email
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data: inviteData, error: inviteError } =
    await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${siteUrl}/auth/confirm?next=/dashboard`,
      data: {
        name,
        company_id: userData.companyId,
      },
    });

  if (inviteError) {
    const alreadyExists =
      inviteError.message.toLowerCase().includes("already") ||
      inviteError.message.toLowerCase().includes("exists") ||
      inviteError.code === "email_exists";
    return NextResponse.json(
      {
        error: alreadyExists
          ? "El email ya está registrado"
          : inviteError.message,
      },
      { status: alreadyExists ? 409 : 500 }
    );
  }

  const authUserId = inviteData.user.id;

  try {
    // Create custom users row
    await userRepo.create({
      id: authUserId,
      name,
      lastName,
      email,
      phone,
      role: "worker",
      companyId: userData.companyId,
    });

    // Create worker row only if a center was provided
    if (centerId && dni && contractType && hourWeek && job) {
      const workerRepo = new SupabaseWorkerRepository(supabase);
      const assignUseCase = new AssignWorkerUseCase(workerRepo);
      await assignUseCase.execute({
        userId: authUserId,
        centerId,
        dni,
        contractType,
        hourWeek: Number(hourWeek),
        job,
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    // Rollback auth user to avoid orphaned accounts
    await adminClient.auth.admin.deleteUser(authUserId).catch(() => {});

    const message =
      e instanceof DomainError ? e.message : "Error al crear el trabajador";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
