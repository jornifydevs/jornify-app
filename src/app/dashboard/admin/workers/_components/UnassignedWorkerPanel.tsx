"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserCog, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
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
    <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-amber-500/30 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-100 dark:hover:bg-slate-700/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-500/20 rounded-lg">
            <UserCog className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            {t("title")}
          </span>
          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
            {unassignedWorkers.length}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700">
          {unassignedWorkers.map((worker) => (
            <div key={worker.id}>
              {/* Worker row */}
              <div className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {worker.name} {worker.lastName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {worker.email}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleAssign(worker)}
                  className={`ml-4 shrink-0 px-3 py-1.5 text-xs rounded-lg transition-colors ${
                    selectedUserId === worker.id
                      ? "bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-600 dark:hover:bg-slate-500 dark:text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {selectedUserId === worker.id ? t("cancel") : t("assign")}
                </button>
              </div>

              {/* Inline assignment form */}
              {selectedUserId === worker.id && (
                <div className="px-5 pb-5 pt-2 space-y-4 bg-slate-50 dark:bg-slate-700/20">
                  {error && (
                    <p className="text-xs text-red-400 font-medium">{error}</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Centro */}
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-slate-400">
                        {t("center")}
                      </label>
                      <select
                        value={form.centerId}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, centerId: e.target.value }))
                        }
                        className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                      >
                        <option value="">{t("selectCenter")}</option>
                        {centers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* DNI */}
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-slate-400">
                        DNI *
                      </label>
                      <input
                        type="text"
                        value={form.dni}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, dni: e.target.value }))
                        }
                        placeholder="12345678A"
                        maxLength={9}
                        className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500"
                      />
                    </div>

                    {/* Tipo de contrato */}
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-slate-400">
                        {t("contractType")}
                      </label>
                      <select
                        value={form.contractType}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            contractType: e.target.value,
                          }))
                        }
                        className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                      >
                        {contractOptions.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Horas/semana */}
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 dark:text-slate-400">
                        {t("hourWeek")}
                      </label>
                      <input
                        type="number"
                        value={form.hourWeek}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, hourWeek: e.target.value }))
                        }
                        min="1"
                        max="168"
                        className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                      />
                    </div>

                    {/* Puesto */}
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs text-slate-500 dark:text-slate-400">
                        {t("job")}
                      </label>
                      <input
                        type="text"
                        value={form.job}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, job: e.target.value }))
                        }
                        placeholder={t("jobPlaceholder")}
                        className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSubmit(worker.id)}
                    disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {submitting && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    {t("confirmAssignment")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
