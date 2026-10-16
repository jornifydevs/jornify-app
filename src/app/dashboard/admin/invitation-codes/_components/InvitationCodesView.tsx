"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Key, Plus, Copy, Check, Clock, CheckCircle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import type { InvitationCode } from "@/core/domain/entities";

interface InvitationCodesViewProps {
  initialCodes: InvitationCode[];
}

function StatusBadge({
  status,
  expiresAt,
}: {
  status: InvitationCode["status"];
  expiresAt: string;
}) {
  const t = useTranslations("dashboard.admin.invitationCodes");
  const expired = status === "pending" && new Date(expiresAt) < new Date();

  if (status === "used") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
        <CheckCircle className="w-3 h-3" />
        {t("statusUsed")}
      </span>
    );
  }

  if (expired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-300">
        <Clock className="w-3 h-3" />
        {t("statusExpired")}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-300">
      <Clock className="w-3 h-3" />
      {t("statusPending")}
    </span>
  );
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const t = useTranslations("dashboard.admin.invitationCodes");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-500 hover:text-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300 dark:hover:text-white transition-colors"
      title={t("copyCode")}
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}

export default function InvitationCodesView({
  initialCodes,
}: InvitationCodesViewProps) {
  const [codes, setCodes] = useState<InvitationCode[]>(initialCodes);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const t = useTranslations("dashboard.admin.invitationCodes");
  const locale = useLocale();

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/admin/invitation-codes", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? t("errorGenerate"));
        return;
      }
      const newCode: InvitationCode = await res.json();
      setCodes((prev) => [newCode, ...prev]);
    } catch {
      setError(t("errorGenerate"));
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const pending = codes.filter(
    (c) => c.status === "pending" && new Date(c.expiresAt) >= new Date()
  ).length;

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 pt-6 lg:pt-8">
        <PageHeader
          title={t("title")}
          description={t("activeCount", { count: pending })}
          actions={
            <Button onClick={handleGenerate} disabled={generating}>
              <Plus />
              {generating ? t("generating") : t("generateCode")}
            </Button>
          }
        />
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-4">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {codes.length === 0 ? (
          <div className="text-center py-16 text-slate-500 dark:text-slate-400">
            <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium mb-1">{t("noCodes")}</p>
            <p className="text-sm">{t("noCodesDesc")}</p>
          </div>
        ) : (
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Mobile */}
            <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-700">
              {codes.map((c) => (
                <div key={c.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-slate-900 dark:text-white font-medium text-sm">
                      {c.code}
                    </span>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={c.status} expiresAt={c.expiresAt} />
                      {c.status === "pending" && <CopyButton code={c.code} />}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("expiresLabel")} {formatDate(c.expiresAt)}
                    {c.createdAt &&
                      ` · ${t("createdLabel")} ${formatDate(c.createdAt)}`}
                  </p>
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {t("columnCode")}
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {t("columnStatus")}
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {t("columnExpires")}
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {t("columnCreated")}
                    </th>
                    <th className="px-6 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {codes.map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-100 dark:hover:bg-slate-700/30"
                    >
                      <td className="px-6 py-4 font-mono text-slate-900 dark:text-white text-sm font-medium">
                        {c.code}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={c.status}
                          expiresAt={c.expiresAt}
                        />
                      </td>
                      <td className="px-6 py-4 text-slate-700 dark:text-slate-300 text-sm">
                        {formatDate(c.expiresAt)}
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-sm">
                        {c.createdAt ? formatDate(c.createdAt) : "—"}
                      </td>
                      <td className="px-6 py-4">
                        {c.status === "pending" && <CopyButton code={c.code} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-sm text-slate-500">{t("info")}</p>
      </div>
    </div>
  );
}
