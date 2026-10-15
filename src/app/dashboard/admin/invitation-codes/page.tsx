import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/server";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseInvitationCodeRepository } from "@/infrastructure/supabase/repositories/supabase-invitation-code.repository";
import { GetInvitationCodesUseCase } from "@/core/application/use-cases/admin/get-invitation-codes.use-case";
import InvitationCodesView from "./_components/InvitationCodesView";

export default async function InvitationCodesPage() {
  const cookieStore = await cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const userRepo = new SupabaseUserRepository(supabase);
  const userData = await userRepo.findByEmail(user.email!);

  if (!userData || userData.role !== "admin" || !userData.companyId) {
    redirect("/dashboard");
  }

  const repo = new SupabaseInvitationCodeRepository(supabase);
  const useCase = new GetInvitationCodesUseCase(repo);
  const codes = await useCase.execute(userData.companyId);

  return <InvitationCodesView initialCodes={codes} />;
}
