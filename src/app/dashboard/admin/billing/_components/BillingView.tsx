"use client";

import { useTranslations } from "next-intl";
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  PauseCircle,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  Subscription,
  SubscriptionStatus,
} from "@/core/domain/entities/subscription";
import { useBilling } from "../_hooks/useBilling";

interface BillingViewProps {
  subscription: Subscription | null;
  variantId: string;
}

type BadgeTone = NonNullable<React.ComponentProps<typeof StatusBadge>["tone"]>;

const STATUS_CONFIG: Record<
  SubscriptionStatus,
  { icon: React.ElementType; tone: BadgeTone }
> = {
  active: { icon: CheckCircle2, tone: "live" },
  on_trial: { icon: Clock, tone: "live" },
  past_due: { icon: AlertCircle, tone: "alert" },
  paused: { icon: PauseCircle, tone: "pause" },
  cancelled: { icon: XCircle, tone: "neutral" },
  expired: { icon: XCircle, tone: "neutral" },
};

function formatDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(isoDate));
}

export default function BillingView({
  subscription,
  variantId,
}: BillingViewProps) {
  const t = useTranslations("dashboard.admin.billing");
  const { startCheckout, loading, error } = useBilling();

  const isActive =
    subscription?.status === "active" || subscription?.status === "on_trial";
  const statusConfig = subscription ? STATUS_CONFIG[subscription.status] : null;
  const StatusIcon = statusConfig?.icon ?? CreditCard;

  return (
    <div>
      <div className="mx-auto max-w-3xl px-6 pt-6 lg:pt-8">
        <PageHeader title={t("pageTitle")} description={t("pageSubtitle")} />
      </div>

      {/* Main */}
      <div className="max-w-3xl mx-auto px-6 py-8 w-full space-y-6">
        {/* Estado actual */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t("currentPlan")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <>
                <StatusBadge tone={statusConfig?.tone} dot={false}>
                  <StatusIcon className="size-4" aria-hidden="true" />
                  {t(`status.${subscription.status}`)}
                </StatusBadge>

                {subscription.currentPeriodEnd && (
                  <p className="text-sm text-muted-foreground">
                    {isActive ? t("renewsAt") : t("expiresAt")}:{" "}
                    <span className="font-medium text-foreground tabular-nums">
                      {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </p>
                )}
              </>
            ) : (
              <StatusBadge tone="neutral" dot={false}>
                <CreditCard className="size-4" aria-hidden="true" />
                {t("status.none")}
              </StatusBadge>
            )}
          </CardContent>
        </Card>

        {/* Acción */}
        {!isActive && variantId && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm">{t("noSubscriptionDesc")}</p>

              {error && <Alert variant="error">{error}</Alert>}

              <Button
                onClick={() => startCheckout(variantId)}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? t("subscribing") : t("subscribe")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
