"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function useBilling() {
  const t = useTranslations("dashboard.admin.billing");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(variantId: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? t("checkoutError"));
        return;
      }

      window.location.href = data.url;
    } catch {
      setError(t("checkoutError"));
    } finally {
      setLoading(false);
    }
  }

  return { startCheckout, loading, error };
}
