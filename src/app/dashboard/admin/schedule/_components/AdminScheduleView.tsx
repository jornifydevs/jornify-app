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
import { useState, type ComponentProps } from "react";
import { useTranslations, useLocale } from "next-intl";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
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

type BadgeTone = NonNullable<ComponentProps<typeof StatusBadge>["tone"]>;

// Normal working days carry no badge; the other day types get their
// categorical tone plus a text label so color is never the only signal.
const DAY_TYPE_BADGES: Record<
  string,
  { tone: BadgeTone; labelKey: "dayHoliday" | "dayVacation" | "daySickLeave" }
> = {
  holiday: { tone: "brand", labelKey: "dayHoliday" },
  vacation: { tone: "pause", labelKey: "dayVacation" },
  sick_leave: { tone: "alert", labelKey: "daySickLeave" },
};

// Grid controls only show on hover where hovering exists; touch screens
// always show them, with a 44px target.
const GRID_ACTION_CLASSES =
  "flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(pointer:coarse)]:size-11";

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
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-center justify-center gap-1.5"
    >
      <Input
        type="time"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        aria-label={t("entry")}
        className="h-11 w-28 px-2 tabular-nums [@media(pointer:fine)]:h-9"
      />
      <span aria-hidden="true" className="text-muted-foreground">
        –
      </span>
      <Input
        type="time"
        value={end}
        onChange={(e) => setEnd(e.target.value)}
        aria-label={t("exit")}
        className="h-11 w-28 px-2 tabular-nums [@media(pointer:fine)]:h-9"
      />
      <Button
        type="submit"
        size="icon"
        disabled={saving}
        aria-label={t("saveShift")}
        className="[@media(pointer:fine)]:size-9"
      >
        <Check />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onCancel}
        aria-label={t("cancel")}
        className="[@media(pointer:fine)]:size-9"
      >
        <X />
      </Button>
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
  const noteId = `swap-note-${swap.id}`;

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">{t("requester")}</dt>
          <dd className="truncate font-mono font-medium">
            {swap.requesterId.slice(0, 8)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-muted-foreground">{t("target")}</dt>
          <dd className="truncate font-mono font-medium">
            {swap.targetId.slice(0, 8)}
          </dd>
        </div>
      </dl>

      <div className="space-y-2">
        <Label htmlFor={noteId}>{t("adminNote")}</Label>
        <Input
          id={noteId}
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("adminNotePlaceholder")}
        />
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => onReview(swap.id, true, note)}
          disabled={submitting}
          className="flex-1"
        >
          {submitting ? t("approving") : t("approve")}
        </Button>
        <Button
          variant="outline"
          onClick={() => onReview(swap.id, false, note)}
          disabled={submitting}
          className="flex-1 text-alert-text hover:bg-alert-soft hover:text-alert-text"
        >
          {submitting ? t("rejecting") : t("reject")}
        </Button>
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

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-8">
        {/* Mensajes */}
        {error && <Alert variant="error">{error}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        {/* Week navigation */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousWeek}
            aria-label={t("previousWeek")}
          >
            <ChevronLeft />
          </Button>

          <div className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-3">
            <span
              aria-live="polite"
              className="text-base font-semibold tabular-nums"
            >
              {weekLabel}
            </span>
            {weekOffset !== 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={goToCurrentWeek}
                className="max-sm:h-11"
              >
                <RefreshCw />
                {tc("back" as never)}
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={goToNextWeek}
            aria-label={t("nextWeek")}
          >
            <ChevronRight />
          </Button>
        </div>

        {/* Workers schedule table */}
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary">
                  <th
                    scope="col"
                    className="min-w-[140px] px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                  >
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
                        scope="col"
                        className={cn(
                          "min-w-[100px] px-3 py-3 text-center text-xs font-medium",
                          isToday ? "text-brand-text" : "text-muted-foreground"
                        )}
                      >
                        {d.toLocaleDateString(locale, {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })}
                        {isToday && (
                          <span className="block font-semibold">
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
                      className="border-b transition-colors last:border-0 hover:bg-accent/60"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-medium">
                            {worker.id.slice(0, 8)}
                          </span>
                          <button
                            onClick={() => setTemplateModalWorkerId(worker.id)}
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(pointer:coarse)]:size-11",
                              hasTemplate
                                ? "bg-brand-soft text-brand-text hover:bg-brand/20"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                            aria-label={
                              hasTemplate
                                ? t("editTemplate")
                                : t("configureTemplate")
                            }
                            title={
                              hasTemplate
                                ? t("editTemplate")
                                : t("configureTemplate")
                            }
                          >
                            <LayoutTemplate
                              className="size-4"
                              aria-hidden="true"
                            />
                          </button>
                        </div>
                      </td>
                      {weekDays.map(({ date, workday }, index) => {
                        const dayType = workday
                          ? DAY_TYPE_BADGES[workday.typeDay]
                          : undefined;
                        return (
                          <td
                            key={date}
                            className={cn(
                              "px-3 py-3 text-center",
                              index >= 5 && "bg-secondary/60"
                            )}
                          >
                            {workday ? (
                              editingWorkdayId === workday.id ? (
                                <EditShiftForm
                                  workday={workday}
                                  onSave={handleSaveShift}
                                  onCancel={() => setEditingWorkdayId(null)}
                                  saving={submitting}
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="group flex items-center justify-center gap-0.5">
                                    <span className="whitespace-nowrap font-mono text-xs tabular-nums">
                                      {formatHour(workday.startWorkday)}–
                                      {formatHour(workday.endWorkday)}
                                    </span>
                                    <button
                                      onClick={() =>
                                        setEditingWorkdayId(workday.id)
                                      }
                                      className={cn(
                                        GRID_ACTION_CLASSES,
                                        "hover:bg-accent hover:text-foreground"
                                      )}
                                      aria-label={t("editShift")}
                                    >
                                      <Pencil
                                        className="size-3.5"
                                        aria-hidden="true"
                                      />
                                    </button>
                                  </div>
                                  {dayType && (
                                    <StatusBadge size="sm" tone={dayType.tone}>
                                      {t(dayType.labelKey)}
                                    </StatusBadge>
                                  )}
                                </div>
                              )
                            ) : (
                              <div className="group grid place-items-center">
                                <span
                                  aria-hidden="true"
                                  className="col-start-1 row-start-1 text-muted-foreground transition-opacity group-hover:opacity-0 group-has-[:focus-visible]:opacity-0 [@media(hover:none)]:opacity-0"
                                >
                                  —
                                </span>
                                <button
                                  onClick={() =>
                                    handleCreateWorkday(worker.id, date)
                                  }
                                  disabled={submitting}
                                  className={cn(
                                    GRID_ACTION_CLASSES,
                                    "col-start-1 row-start-1 hover:bg-brand-soft hover:text-brand-text disabled:opacity-30"
                                  )}
                                  aria-label={t("addWorkday")}
                                  title={t("addWorkday")}
                                >
                                  <Plus className="size-4" aria-hidden="true" />
                                </button>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending swaps */}
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            {t("pendingSwaps")}
            {pendingSwaps.length > 0 && (
              <StatusBadge
                tone="brand"
                size="sm"
                dot={false}
                className="tabular-nums"
              >
                {pendingSwaps.length}
              </StatusBadge>
            )}
          </h2>

          {loadingSwaps ? (
            <div className="h-20 animate-pulse rounded-xl bg-track motion-reduce:animate-none" />
          ) : pendingSwaps.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("noPendingSwaps")}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        </section>
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
