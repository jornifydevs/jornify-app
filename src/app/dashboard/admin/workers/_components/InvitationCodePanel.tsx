"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Key,
  Plus,
  Copy,
  Check,
  Clock,
  CheckCircle,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InvitationCode } from "@/core/domain/entities";

interface InvitationCodePanelProps {
  initialCodes: InvitationCode[];
}

function StatusBadge({
  status,
  expiresAt,
}: {
  status: InvitationCode["status"];
  expiresAt: string;
}) {
  const t = useTranslations("dashboard.admin.workers.panel");
  const expired = status === "pending" && new Date(expiresAt) < new Date();

  if (status === "used") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
        <CheckCircle className="w-3 h-3" />
        {t("statusUsed")}
      </span>
    );
  }
  if (expired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-900/40 text-red-400">
        <Clock className="w-3 h-3" />
        {t("statusExpired")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/40 text-green-400">
      <Clock className="w-3 h-3" />
      {t("statusPending")}
    </span>
  );
}

function CopyButton({ code }: { code: string }) {
  const t = useTranslations("dashboard.admin.workers.panel");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center justify-center w-7 h-7 rounded-md bg-slate-200 hover:bg-slate-300 text-slate-500 hover:text-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-400 dark:hover:text-white transition-colors"
      title={t("copyCode")}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

export default function InvitationCodePanel({
  initialCodes,
}: InvitationCodePanelProps) {
  const t = useTranslations("dashboard.admin.workers.panel");
  const locale = useLocale();
  const [codes, setCodes] = useState<InvitationCode[]>(initialCodes);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/invitation-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: quantity }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? t("errorGenerate"));
        return;
      }
      const newCodes: InvitationCode[] = await res.json();
      setCodes((prev) => [...newCodes, ...prev]);
    } catch {
      setError(t("errorGenerate"));
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/invitation-codes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? t("errorDelete"));
        return;
      }
      setCodes((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError(t("errorDelete"));
    } finally {
      setDeletingId(null);
    }
  };

  const formatExpiry = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: "2-digit",
      month: "short",
    });

  const pendingCount = codes.filter(
    (c) => c.status === "pending" && new Date(c.expiresAt) >= new Date()
  ).length;

  return (
    <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Panel header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            {t("title")}
          </span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-600/30 text-blue-300">
              {pendingCount} {t("statusPending").toLowerCase()}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
        />
      </button>

      {!collapsed && (
        <>
          {/* Generate button */}
          <div className="flex items-center justify-end gap-2 px-4 py-2 border-b border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
                {t("quantity")}
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={quantity}
                onChange={(e) => {
                  const v = Math.min(
                    20,
                    Math.max(1, Number(e.target.value) || 1)
                  );
                  setQuantity(v);
                }}
                className="w-14 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 text-center focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-white"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generating}
              size="sm"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg h-8 px-3"
            >
              <Plus className="w-3.5 h-3.5" />
              {generating
                ? t("generating")
                : quantity > 1
                  ? t("generateCodes", { count: quantity })
                  : t("generateCode")}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20">
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Codes list — only shows unused codes */}
          {codes.filter((c) => c.status !== "used").length === 0 ? (
            <div className="px-4 py-5 text-center text-slate-500 text-sm">
              {t("noActiveCodes")}
            </div>
          ) : (
            <div className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
              {codes
                .filter((c) => c.status !== "used")
                .map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700/20"
                  >
                    <span className="font-mono text-sm text-slate-900 dark:text-white flex-1 min-w-0 truncate">
                      {c.code}
                    </span>
                    <StatusBadge status={c.status} expiresAt={c.expiresAt} />
                    <span className="text-xs text-slate-500 hidden sm:block shrink-0">
                      {formatExpiry(c.expiresAt)}
                    </span>
                    {c.status === "pending" && (
                      <>
                        <CopyButton code={c.code} />
                        <button
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          className="flex items-center justify-center w-7 h-7 rounded-md bg-slate-200 hover:bg-red-100 text-slate-500 hover:text-red-500 dark:bg-slate-700 dark:hover:bg-red-900/60 dark:text-slate-400 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                          title={t("deleteCode")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
            </div>
          )}

          <div className="px-4 py-2 border-t border-slate-200/60 dark:border-slate-700/60">
            <p className="text-xs text-slate-400 dark:text-slate-600">
              {t("info")}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
