"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  PauseCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  Subscription,
  SubscriptionStatus,
} from "@/core/domain/entities/subscription";
import { useBilling } from "../_hooks/useBilling";

interface BillingViewProps {
  subscription: Subscription | null;
  variantId: string;
}

const STATUS_CONFIG: Record<
  SubscriptionStatus,
  { icon: React.ElementType; badgeClass: string }
> = {
  active: {
    icon: CheckCircle2,
    badgeClass: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  on_trial: {
    icon: Clock,
    badgeClass: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  past_due: {
    icon: AlertCircle,
    badgeClass: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  paused: {
    icon: PauseCircle,
    badgeClass: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  cancelled: {
    icon: XCircle,
    badgeClass: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  },
  expired: {
    icon: XCircle,
    badgeClass: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  },
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
    <div className="flex flex-1 flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <button className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t("pageTitle")}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("pageSubtitle")}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-6 py-8 w-full space-y-6">
        {/* Estado actual */}
        <Card className="border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium text-slate-700 dark:text-slate-300">
              {t("currentPlan")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <>
                <div className="flex items-center gap-3">
                  <StatusIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                  <span
                    className={`text-sm px-3 py-1 rounded-full border font-medium ${statusConfig?.badgeClass ?? ""}`}
                  >
                    {t(`status.${subscription.status}`)}
                  </span>
                </div>

                {subscription.currentPeriodEnd && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {isActive ? t("renewsAt") : t("expiresAt")}:{" "}
                    <span className="font-medium text-slate-900 dark:text-white">
                      {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-slate-400" />
                <span className="text-sm px-3 py-1 rounded-full border font-medium bg-slate-500/20 text-slate-400 border-slate-500/30">
                  {t("status.none")}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acción */}
        {!isActive && variantId && (
          <Card className="border-indigo-500/30 bg-indigo-600/5 dark:bg-indigo-600/10">
            <CardContent className="pt-6 space-y-4">
              <p className="text-slate-700 dark:text-slate-300 text-sm">
                {t("noSubscriptionDesc")}
              </p>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <Button
                onClick={() => startCheckout(variantId)}
                disabled={loading}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? t("subscribing") : t("subscribe")}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
