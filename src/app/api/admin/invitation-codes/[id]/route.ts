import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/infrastructure/supabase/server";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseInvitationCodeRepository } from "@/infrastructure/supabase/repositories/supabase-invitation-code.repository";
import { DeleteInvitationCodeUseCase } from "@/core/application/use-cases/admin/delete-invitation-code.use-case";

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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAdminContext();
  if (!ctx) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  const repo = new SupabaseInvitationCodeRepository(ctx.supabase);
  const useCase = new DeleteInvitationCodeUseCase(repo);

  try {
    await useCase.execute(id);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json(
      { error: "Error al eliminar el código" },
      { status: 500 }
    );
  }
}
