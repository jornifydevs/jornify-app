import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/infrastructure/supabase/server";
import { SupabaseInvitationCodeRepository } from "@/infrastructure/supabase/repositories/supabase-invitation-code.repository";
import { ValidateInvitationCodeUseCase } from "@/core/application/use-cases/auth/validate-invitation-code.use-case";
import { DomainError } from "@/core/domain/errors/domain-errors";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { valid: false, error: "Código requerido" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);
  const repo = new SupabaseInvitationCodeRepository(supabase);
  const useCase = new ValidateInvitationCodeUseCase(repo);

  try {
    const invitation = await useCase.execute(code);
    return NextResponse.json({ valid: true, companyId: invitation.companyId });
  } catch (e) {
    const message =
      e instanceof DomainError ? e.message : "Error al validar el código";
    return NextResponse.json({ valid: false, error: message }, { status: 400 });
  }
}
