"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Key, Plus, Copy, Check } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InvitationCode } from "@/core/domain/entities";

interface InvitationCodesViewProps {
  initialCodes: InvitationCode[];
}

function CodeStatusBadge({
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
  const [copied, setCopied] = useState(false);
  const t = useTranslations("dashboard.admin.invitationCodes");

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
      className="shrink-0 md:size-9"
    >
      {copied ? <Check className="text-live-text" /> : <Copy />}
    </Button>
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
      <div className="mx-auto max-w-7xl space-y-4 px-6 py-8">
        {error && <Alert variant="error">{error}</Alert>}

        {codes.length === 0 ? (
          <div className="py-16 text-center">
            <Key
              aria-hidden="true"
              className="mx-auto mb-4 size-10 text-muted-foreground"
            />
            <p className="mb-1 font-medium">{t("noCodes")}</p>
            <p className="text-sm text-muted-foreground">{t("noCodesDesc")}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            {/* Mobile */}
            <ul className="divide-y md:hidden">
              {codes.map((c) => (
                <li key={c.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium">
                        {c.code}
                      </span>
                      <CodeStatusBadge
                        status={c.status}
                        expiresAt={c.expiresAt}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {t("expiresLabel")} {formatDate(c.expiresAt)}
                      {c.createdAt &&
                        ` · ${t("createdLabel")} ${formatDate(c.createdAt)}`}
                    </p>
                  </div>
                  {c.status === "pending" && <CopyButton code={c.code} />}
                </li>
              ))}
            </ul>

            {/* Desktop */}
            <div className="hidden md:block">
              <Table>
                <TableHeader className="bg-secondary">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="px-6">{t("columnCode")}</TableHead>
                    <TableHead className="px-6">{t("columnStatus")}</TableHead>
                    <TableHead className="px-6">{t("columnExpires")}</TableHead>
                    <TableHead className="px-6">{t("columnCreated")}</TableHead>
                    <TableHead className="w-12 px-6" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="px-6 py-3 font-mono font-medium">
                        {c.code}
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        <CodeStatusBadge
                          status={c.status}
                          expiresAt={c.expiresAt}
                        />
                      </TableCell>
                      <TableCell className="px-6 py-3 tabular-nums">
                        {formatDate(c.expiresAt)}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-muted-foreground tabular-nums">
                        {c.createdAt ? formatDate(c.createdAt) : "—"}
                      </TableCell>
                      <TableCell className="px-6 py-3">
                        {c.status === "pending" && <CopyButton code={c.code} />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <p className="text-sm text-muted-foreground">{t("info")}</p>
      </div>
    </div>
  );
}
