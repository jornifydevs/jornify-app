"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserCog, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { StatusBadge } from "@/components/ui/status-badge";
import type { User, Center } from "@/core/domain/entities";

interface UnassignedWorkerPanelProps {
  unassignedWorkers: User[];
  centers: Center[];
}

interface FormState {
  centerId: string;
  dni: string;
  contractType: string;
  hourWeek: string;
  job: string;
}

const defaultForm: FormState = {
  centerId: "",
  dni: "",
  contractType: "full_time",
  hourWeek: "40",
  job: "",
};

export default function UnassignedWorkerPanel({
  unassignedWorkers,
  centers,
}: UnassignedWorkerPanelProps) {
  const router = useRouter();
  const t = useTranslations("dashboard.admin.workers.unassigned");
  const [expanded, setExpanded] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contractOptions = [
    { value: "full_time", label: t("contractFull") },
    { value: "part_time", label: t("contractPart") },
    { value: "temporary", label: t("contractTemp") },
    { value: "internship", label: t("contractIntern") },
  ];

  if (unassignedWorkers.length === 0) return null;

  const handleToggleAssign = (worker: User) => {
    if (selectedUserId === worker.id) {
      setSelectedUserId(null);
      setError(null);
    } else {
      setSelectedUserId(worker.id);
      setForm({ ...defaultForm, dni: worker.dni ?? "" });
      setError(null);
    }
  };

  const handleSubmit = async (userId: string) => {
    setError(null);
    const { centerId, dni, contractType, hourWeek, job } = form;

    if (!centerId || !dni.trim() || !contractType || !hourWeek || !job.trim()) {
      setError(t("fillRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          centerId,
          dni: dni.trim().toUpperCase(),
          contractType,
          hourWeek: Number(hourWeek),
          job: job.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? t("errorAssign"));
        return;
      }

      setSelectedUserId(null);
      router.refresh();
    } catch {
      setError(t("errorConnect"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5"
      >
        <span className="flex min-w-0 items-center gap-3">
          <UserCog
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground"
          />
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold">{t("title")}</span>
            <StatusBadge
              tone="brand"
              size="sm"
              dot={false}
              className="tabular-nums"
            >
              {unassignedWorkers.length}
            </StatusBadge>
          </span>
        </span>
        {expanded ? (
          <ChevronUp
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground"
          />
        ) : (
          <ChevronDown
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground"
          />
        )}
      </button>

      {expanded && (
        <ul className="divide-y border-t">
          {unassignedWorkers.map((worker) => (
            <li key={worker.id}>
              {/* Worker row */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {worker.name} {worker.lastName}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {worker.email}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={selectedUserId === worker.id ? "outline" : "default"}
                  onClick={() => handleToggleAssign(worker)}
                  aria-expanded={selectedUserId === worker.id}
                  className="shrink-0"
                >
                  {selectedUserId === worker.id ? t("cancel") : t("assign")}
                </Button>
              </div>

              {/* Inline assignment form */}
              {selectedUserId === worker.id && (
                <div className="space-y-5 bg-secondary px-4 py-5 sm:px-5">
                  {error && <Alert variant="error">{error}</Alert>}

                  <div className="grid grid-cols-1 gap-x-4 gap-y-5 sm:grid-cols-2">
                    {/* Centro */}
                    <div className="space-y-2">
                      <Label htmlFor={`assign-center-${worker.id}`}>
                        {t("center")}
                      </Label>
                      <NativeSelect
                        id={`assign-center-${worker.id}`}
                        value={form.centerId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, centerId: e.target.value }))
                        }
                      >
                        <option value="">{t("selectCenter")}</option>
                        {centers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>

                    {/* DNI */}
                    <div className="space-y-2">
                      <Label htmlFor={`assign-dni-${worker.id}`}>
                        {t("dni")}
                      </Label>
                      <Input
                        id={`assign-dni-${worker.id}`}
                        type="text"
                        value={form.dni}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, dni: e.target.value }))
                        }
                        placeholder="12345678A"
                        maxLength={9}
                      />
                    </div>

                    {/* Tipo de contrato */}
                    <div className="space-y-2">
                      <Label htmlFor={`assign-contract-${worker.id}`}>
                        {t("contractType")}
                      </Label>
                      <NativeSelect
                        id={`assign-contract-${worker.id}`}
                        value={form.contractType}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            contractType: e.target.value,
                          }))
                        }
                      >
                        {contractOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>

                    {/* Horas/semana */}
                    <div className="space-y-2">
                      <Label htmlFor={`assign-hours-${worker.id}`}>
                        {t("hourWeek")}
                      </Label>
                      <Input
                        id={`assign-hours-${worker.id}`}
                        type="number"
                        value={form.hourWeek}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, hourWeek: e.target.value }))
                        }
                        min="1"
                        max="168"
                        className="tabular-nums"
                      />
                    </div>

                    {/* Puesto */}
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor={`assign-job-${worker.id}`}>
                        {t("job")}
                      </Label>
                      <Input
                        id={`assign-job-${worker.id}`}
                        type="text"
                        value={form.job}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, job: e.target.value }))
                        }
                        placeholder={t("jobPlaceholder")}
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={() => handleSubmit(worker.id)}
                    disabled={submitting}
                    className="w-full sm:w-auto"
                  >
                    {submitting && <Loader2 className="animate-spin" />}
                    {t("confirmAssignment")}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
