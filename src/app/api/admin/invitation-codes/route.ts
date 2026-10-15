import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/infrastructure/supabase/server";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseInvitationCodeRepository } from "@/infrastructure/supabase/repositories/supabase-invitation-code.repository";
import { GetInvitationCodesUseCase } from "@/core/application/use-cases/admin/get-invitation-codes.use-case";
import { GenerateInvitationCodeUseCase } from "@/core/application/use-cases/admin/generate-invitation-code.use-case";

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

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const repo = new SupabaseInvitationCodeRepository(ctx.supabase);
  const useCase = new GetInvitationCodesUseCase(repo);
  const codes = await useCase.execute(ctx.userData.companyId!);

  return NextResponse.json(codes);
}

export async function POST(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let count = 1;
  try {
    const body = await request.json();
    const parsed = Number(body?.count);
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 20) {
      count = parsed;
    }
  } catch {
    // body vacío o no-JSON → count = 1
  }

  const repo = new SupabaseInvitationCodeRepository(ctx.supabase);
  const useCase = new GenerateInvitationCodeUseCase(repo);

  const codes = await Promise.all(
    Array.from({ length: count }, () =>
      useCase.execute({
        companyId: ctx.userData.companyId!,
        createdBy: ctx.userData.id,
      })
    )
  );

  return NextResponse.json(codes, { status: 201 });
}
