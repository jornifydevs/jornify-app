"use client";

import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Pencil,
  Check,
  X,
  LayoutTemplate,
  Plus,
} from "lucide-react";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader } from "@/components/PageHeader";
import type {
  Worker,
  Workday,
  ShiftSwapRequest,
  WorkerScheduleTemplate,
  Center,
} from "@/core/domain/entities";
import { useAdminSchedule } from "../_hooks/useAdminSchedule";
import type { UpdateShiftInput } from "@/core/application/dtos/shifts.dto";
import WorkerTemplateModal from "./WorkerTemplateModal";

interface AdminScheduleViewProps {
  centerId: string;
  centerName: string;
  center: Center;
  adminUserId: string;
  workers: Worker[];
  initialWorkdays: Workday[];
  initialTemplates: WorkerScheduleTemplate[];
}

function formatHour(time: string): string {
  return time.slice(0, 5);
}

function EditShiftForm({
  workday,
  onSave,
  onCancel,
  saving,
}: {
  workday: Workday;
  onSave: (workdayId: string, input: UpdateShiftInput) => Promise<boolean>;
  onCancel: () => void;
  saving: boolean;
}) {
  const t = useTranslations("dashboard.admin.schedule");
  const [start, setStart] = useState(workday.startWorkday.slice(0, 5));
  const [end, setEnd] = useState(workday.endWorkday.slice(0, 5));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onSave(workday.id, {
      startWorkday: start + ":00",
      endWorkday: end + ":00",
      breakType: workday.breakType,
      scheduledStartBreak: workday.scheduledStartBreak,
      scheduledEndBreak: workday.scheduledEndBreak,
    });
    if (ok) onCancel();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-wrap">
      <input
        type="time"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
      />
      <span className="text-xs text-slate-400">–</span>
      <input
        type="time"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        className="text-xs px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
      />
      <button
        type="submit"
        disabled={saving}
        className="p-1 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded transition-colors disabled:opacity-50"
        aria-label={t("saveShift")}
      >
        <Check className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="p-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded transition-colors"
        aria-label={t("cancel")}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </form>
  );
}

function SwapReviewCard({
  swap,
  onReview,
  submitting,
}: {
  swap: ShiftSwapRequest;
  onReview: (swapId: string, approve: boolean, adminNote?: string) => void;
  submitting: boolean;
}) {
  const t = useTranslations("dashboard.admin.schedule");
  const [note, setNote] = useState("");

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {t("requester")}:{" "}
          </span>
          <span className="font-mono">{swap.requesterId.slice(0, 8)}</span>
        </div>
        <div>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {t("target")}:{" "}
          </span>
          <span className="font-mono">{swap.targetId.slice(0, 8)}</span>
        </div>
      </div>

      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={t("adminNotePlaceholder")}
        className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
      />

      <div className="flex gap-2">
        <button
          onClick={() => onReview(swap.id, true, note)}
          disabled={submitting}
          className="flex-1 text-xs py-2 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg transition-colors disabled:opacity-50 font-medium"
        >
          {submitting ? t("approving") : t("approve")}
        </button>
        <button
          onClick={() => onReview(swap.id, false, note)}
          disabled={submitting}
          className="flex-1 text-xs py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50 font-medium"
        >
          {submitting ? t("rejecting") : t("reject")}
        </button>
      </div>
    </div>
  );
}

export default function AdminScheduleView({
  centerId,
  centerName,
  center,
  adminUserId,
  workers,
  initialWorkdays,
  initialTemplates,
}: AdminScheduleViewProps) {
  const t = useTranslations("dashboard.admin.schedule");
  const tc = useTranslations("common");
  const locale = useLocale();

  const [editingWorkdayId, setEditingWorkdayId] = useState<string | null>(null);
  const [workdays, setWorkdays] = useState<Workday[]>(initialWorkdays);
  const [templateModalWorkerId, setTemplateModalWorkerId] = useState<
    string | null
  >(null);

  const {
    pendingSwaps,
    loadingSwaps,
    submitting,
    error,
    successMessage,
    weekOffset,
    weekLabel,
    templates,
    updateShift,
    reviewSwap,
    saveTemplate,
    createWorkday,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
  } = useAdminSchedule({ centerId, adminUserId, center, initialTemplates });

  const handleSaveShift = async (
    workdayId: string,
    input: UpdateShiftInput
  ): Promise<boolean> => {
    const ok = await updateShift(workdayId, input);
    if (ok) {
      setWorkdays((prev) =>
        prev.map((w) =>
          w.id === workdayId
            ? {
                ...w,
                startWorkday: input.startWorkday,
                endWorkday: input.endWorkday,
              }
            : w
        )
      );
    }
    return ok;
  };

  const handleCreateWorkday = async (workerId: string, date: string) => {
    const newWorkday = await createWorkday(workerId, date);
    if (newWorkday) {
      setWorkdays((prev) => [...prev, newWorkday]);
    }
  };

  const templateModalWorker = templateModalWorkerId
    ? (workers.find((w) => w.id === templateModalWorkerId) ?? null)
    : null;
  const templateModalExisting = templateModalWorkerId
    ? (templates.find((t) => t.workerId === templateModalWorkerId) ?? null)
    : null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 pt-6 lg:pt-8">
        <PageHeader
          title={t("pageTitle")}
          description={centerName}
          backHref="/dashboard/admin/schedule"
          backLabel={tc("back")}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Mensajes */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-green-600 dark:text-green-400 text-sm">
            {successMessage}
          </div>
        )}

        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={goToPreviousWeek}
            className="flex items-center justify-center w-10 h-10 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
            aria-label={t("previousWeek")}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {weekLabel}
            </span>
            {weekOffset !== 0 && (
              <button
                onClick={goToCurrentWeek}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                {tc("back" as never)}
              </button>
            )}
          </div>

          <button
            onClick={goToNextWeek}
            className="flex items-center justify-center w-10 h-10 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
            aria-label={t("nextWeek")}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Workers schedule table */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 dark:text-slate-400 min-w-[160px]">
                    {t("worker")}
                  </th>
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    const dayOfWeek = d.getDay();
                    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                    d.setDate(d.getDate() - daysToMonday + weekOffset * 7 + i);
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    const isToday = dateStr === today;
                    return (
                      <th
                        key={dateStr}
                        className={`text-center px-3 py-3 font-medium text-xs min-w-[100px] ${
                          isToday
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {d.toLocaleDateString(locale, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                        {isToday && (
                          <span className="block text-xs font-normal">
                            ({t("today")})
                          </span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {workers.map((worker) => {
                  const now = new Date();
                  const dayOfWeek = now.getDay();
                  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                  const monday = new Date(now);
                  monday.setDate(now.getDate() - daysToMonday + weekOffset * 7);
                  monday.setHours(0, 0, 0, 0);

                  const weekDays = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(monday);
                    d.setDate(monday.getDate() + i);
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                    return {
                      date: dateStr,
                      workday:
                        workdays.find(
                          (w) => w.workerId === worker.id && w.day === dateStr
                        ) ?? null,
                    };
                  });

                  const hasTemplate = templates.some(
                    (t) => t.workerId === worker.id
                  );

                  return (
                    <tr
                      key={worker.id}
                      className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-300 font-mono">
                            {worker.id.slice(0, 8)}
                          </span>
                          <button
                            onClick={() => setTemplateModalWorkerId(worker.id)}
                            className={`p-1 rounded transition-colors ${
                              hasTemplate
                                ? "text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                : "text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                            }`}
                            aria-label={t("configureTemplate")}
                            title={t("configureTemplate")}
                          >
                            <LayoutTemplate className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      {weekDays.map(({ date, workday }) => (
                        <td key={date} className="px-3 py-3 text-center">
                          {workday ? (
                            editingWorkdayId === workday.id ? (
                              <EditShiftForm
                                workday={workday}
                                onSave={handleSaveShift}
                                onCancel={() => setEditingWorkdayId(null)}
                                saving={submitting}
                              />
                            ) : (
                              <div className="flex items-center justify-center gap-1 group">
                                <span className="text-xs font-mono text-slate-700 dark:text-slate-200">
                                  {formatHour(workday.startWorkday)}–
                                  {formatHour(workday.endWorkday)}
                                </span>
                                <button
                                  onClick={() =>
                                    setEditingWorkdayId(workday.id)
                                  }
                                  className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-orange-500 transition-all"
                                  aria-label={t("editShift")}
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            )
                          ) : (
                            <div className="group flex items-center justify-center">
                              <button
                                onClick={() =>
                                  handleCreateWorkday(worker.id, date)
                                }
                                disabled={submitting}
                                className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 hover:bg-orange-100 dark:bg-slate-700 dark:hover:bg-orange-900/30 text-slate-400 hover:text-orange-500 dark:text-slate-500 dark:hover:text-orange-400 transition-all disabled:opacity-30"
                                aria-label={t("addWorkday")}
                                title={t("addWorkday")}
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <span className="group-hover:hidden text-xs text-slate-300 dark:text-slate-600">
                                —
                              </span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending swaps */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            {t("pendingSwaps")}
            {pendingSwaps.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full">
                {pendingSwaps.length}
              </span>
            )}
          </h2>

          {loadingSwaps ? (
            <div className="h-20 bg-slate-200 dark:bg-slate-700/50 rounded-xl animate-pulse" />
          ) : pendingSwaps.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">
              {t("noPendingSwaps")}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingSwaps.map((swap) => (
                <SwapReviewCard
                  key={swap.id}
                  swap={swap}
                  onReview={(swapId, approve, adminNote) =>
                    reviewSwap({ swapRequestId: swapId, approve, adminNote })
                  }
                  submitting={submitting}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Template modal */}
      {templateModalWorkerId && templateModalWorker && (
        <WorkerTemplateModal
          workerId={templateModalWorkerId}
          workerName={templateModalWorker.id.slice(0, 8)}
          existingTemplate={templateModalExisting}
          defaultStart={center.defaultStartWorkday}
          defaultEnd={center.defaultEndWorkday}
          saving={submitting}
          onSave={saveTemplate}
          onClose={() => setTemplateModalWorkerId(null)}
        />
      )}
    </div>
  );
}
