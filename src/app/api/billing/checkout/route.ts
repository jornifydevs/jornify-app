import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/infrastructure/supabase/server";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { LemonSqueezyAdapter } from "@/infrastructure/payment/lemon-squeezy.adapter";
import { CreateCheckoutSessionUseCase } from "@/core/application/use-cases/billing/create-checkout-session.use-case";
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
  const { variantId } = body as { variantId: string };

  const origin =
    request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const successUrl = `${origin}/dashboard/billing?success=true`;
  const cancelUrl = `${origin}/dashboard/billing?canceled=true`;

  try {
    const paymentService = new LemonSqueezyAdapter();
    const useCase = new CreateCheckoutSessionUseCase(paymentService);
    const session = await useCase.execute(
      variantId,
      userData.companyId,
      successUrl,
      cancelUrl
    );
    return NextResponse.json({ url: session.url });
  } catch (e) {
    if (e instanceof DomainError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
