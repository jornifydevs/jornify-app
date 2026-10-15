/*

NOTE:

If you have email confirmation turned on (the default),
a new user will receive an email confirmation after signing up.
Change the email template to support a server-side authentication flow.
Go to the Auth templates page in your dashboard. In the Confirm signup template,
change {{ .ConfirmationURL }} to {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email.

*/

import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { createClient } from "@/infrastructure/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseCompanyRepository } from "@/infrastructure/supabase/repositories/supabase-company.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { SupabaseInvitationCodeRepository } from "@/infrastructure/supabase/repositories/supabase-invitation-code.repository";
import { CompleteWorkerRegistrationUseCase } from "@/core/application/use-cases/auth/complete-worker-registration.use-case";
import { CompleteCompanyRegistrationUseCase } from "@/core/application/use-cases/auth/complete-company-registration.use-case";
import { PLANS } from "@/core/domain/entities";
import type { PlanId } from "@/core/domain/entities";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (token_hash && type) {
    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const meta = user.user_metadata;
        const userRepo = new SupabaseUserRepository(supabase);

        try {
          if (meta.registration_type === "worker") {
            const invitationCodeRepo = new SupabaseInvitationCodeRepository(
              supabase
            );
            const useCase = new CompleteWorkerRegistrationUseCase(
              userRepo,
              invitationCodeRepo
            );
            await useCase.execute({
              userId: user.id,
              name: meta.name ?? "",
              lastName: meta.last_name ?? "",
              email: user.email ?? "",
              phone: meta.phone,
              dni: meta.dni,
              invitationCode: meta.invitation_code ?? "",
            });
          } else if (meta.registration_type === "company") {
            const companyRepo = new SupabaseCompanyRepository(supabase);
            const centerRepo = new SupabaseCenterRepository(supabase);

            // Resolve plan features from selected_plan metadata
            const planId = (meta.selected_plan ?? "free") as PlanId;
            const plan = PLANS[planId] ?? PLANS.free;

            const useCase = new CompleteCompanyRegistrationUseCase(
              companyRepo,
              userRepo,
              centerRepo
            );
            await useCase.execute({
              userId: user.id,
              adminName: meta.admin_name ?? "",
              adminLastName: meta.admin_last_name ?? "",
              email: user.email ?? "",
              nif: meta.nif ?? "",
              companyName: meta.company_name ?? "",
              businessName: meta.business_name ?? "",
              address: meta.address ?? "",
              companyEmail: meta.company_email ?? user.email ?? "",
              nationality: meta.nationality ?? "ES",
              enabledFeatures: plan.enabledFeatures,
              allowedDayTypes: plan.allowedDayTypes,
            });
          }
        } catch (err) {
          // Profile creation failure should not block access —
          // the auth account exists and the user can retry later.
          const registrationType = meta.registration_type ?? "unknown";
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.error(
            `[/auth/confirm] profile creation failed for type="${registrationType}" userId="${user.id}": ${errorMessage}`,
            err
          );
        }
      }

      redirect(next);
    }
  }

  redirect("/error");
}
