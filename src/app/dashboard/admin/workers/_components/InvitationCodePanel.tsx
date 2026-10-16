"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Key, Plus, Copy, Check, ChevronDown, Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import type { InvitationCode } from "@/core/domain/entities";

interface InvitationCodePanelProps {
  initialCodes: InvitationCode[];
}

function CodeStatusBadge({
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
      <StatusBadge tone="neutral" size="sm">
        {t("statusUsed")}
      </StatusBadge>
    );
  }
  if (expired) {
    return (
      <StatusBadge tone="alert" size="sm">
        {t("statusExpired")}
      </StatusBadge>
    );
  }
  return (
    <StatusBadge tone="live" size="sm">
      {t("statusPending")}
    </StatusBadge>
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
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      aria-label={t("copyCode")}
      title={t("copyCode")}
      className="sm:size-9"
    >
      {copied ? <Check className="text-live-text" /> : <Copy />}
    </Button>
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
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Panel header */}
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        aria-expanded={!collapsed}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
      >
        <span className="flex min-w-0 items-center gap-3">
          <Key
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground"
          />
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold">{t("title")}</span>
            {pendingCount > 0 && (
              <StatusBadge
                tone="neutral"
                size="sm"
                dot={false}
                className="tabular-nums"
              >
                {t("pendingCount", { count: pendingCount })}
              </StatusBadge>
            )}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none",
            collapsed && "-rotate-90"
          )}
        />
      </button>

      {!collapsed && (
        <div className="border-t">
          {/* Generate button */}
          <div className="flex flex-wrap items-center justify-end gap-3 border-b px-4 py-3 sm:px-5">
            <div className="flex items-center gap-2">
              <Label
                htmlFor="invitation-code-quantity"
                className="shrink-0 text-muted-foreground"
              >
                {t("quantity")}
              </Label>
              <Input
                id="invitation-code-quantity"
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
                className="h-11 w-20 px-2 text-center tabular-nums"
              />
            </div>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
            >
              <Plus />
              {generating
                ? t("generating")
                : quantity > 1
                  ? t("generateCodes", { count: quantity })
                  : t("generateCode")}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <Alert variant="error" className="rounded-none border-b sm:px-5">
              {error}
            </Alert>
          )}

          {/* Codes list — only shows unused codes */}
          {codes.filter((c) => c.status !== "used").length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground sm:px-5">
              {t("noActiveCodes")}
            </p>
          ) : (
            <ul className="divide-y">
              {codes
                .filter((c) => c.status !== "used")
                .map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 px-4 py-2 sm:px-5"
                  >
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="min-w-0 truncate font-mono text-sm font-medium sm:flex-1">
                        {c.code}
                      </span>
                      <CodeStatusBadge
                        status={c.status}
                        expiresAt={c.expiresAt}
                      />
                      <span className="hidden shrink-0 text-xs text-muted-foreground tabular-nums sm:block">
                        {formatExpiry(c.expiresAt)}
                      </span>
                    </div>
                    {c.status === "pending" && (
                      <div className="flex shrink-0 items-center gap-1">
                        <CopyButton code={c.code} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(c.id)}
                          disabled={deletingId === c.id}
                          aria-label={t("deleteCode")}
                          title={t("deleteCode")}
                          className="text-muted-foreground hover:bg-alert-soft hover:text-alert-text sm:size-9"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          )}

          <p className="border-t px-4 py-3 text-xs text-muted-foreground sm:px-5">
            {t("info")}
          </p>
        </div>
      )}
    </div>
  );
}
