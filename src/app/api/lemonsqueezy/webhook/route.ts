import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/infrastructure/supabase/admin";
import { SupabaseSubscriptionRepository } from "@/infrastructure/supabase/repositories/supabase-subscription.repository";
import { ProcessLemonSqueezyWebhookUseCase } from "@/core/application/use-cases/billing/process-lemon-squeezy-webhook.use-case";
import { ValidationError } from "@/core/domain/errors/domain-errors";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");

  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret no configurado" },
      { status: 500 }
    );
  }

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  if (signature !== digest) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const supabase = createAdminClient();
    const subscriptionRepo = new SupabaseSubscriptionRepository(supabase);
    const useCase = new ProcessLemonSqueezyWebhookUseCase(subscriptionRepo);
    await useCase.execute(payload);
    return NextResponse.json({ received: true });
  } catch (e) {
    if (e instanceof ValidationError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
