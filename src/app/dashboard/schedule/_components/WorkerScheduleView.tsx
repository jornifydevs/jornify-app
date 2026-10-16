"use client";

import type { ComponentProps } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { useWorkerSchedule } from "../_hooks/useWorkerSchedule";
import { useShiftSwap } from "../_hooks/useShiftSwap";
import ShiftSwapPanel from "./ShiftSwapPanel";

interface WorkerScheduleViewProps {
  workerId: string;
  centerId: string;
}

type StatusTone = ComponentProps<typeof StatusBadge>["tone"];

// Categorical day types: holiday → brand, vacation → pause, sick leave → alert.
const TYPE_TONES: Record<string, StatusTone> = {
  normal: "neutral",
  holiday: "brand",
  vacation: "pause",
  sick_leave: "alert",
};

const TYPE_LABEL_KEYS = {
  normal: "typeNormal",
  holiday: "typeHoliday",
  vacation: "typeVacation",
  sick_leave: "typeSickLeave",
} as const;

function formatHour(time: string): string {
  return time.slice(0, 5);
}

export default function WorkerScheduleView({
  workerId,
  centerId,
}: WorkerScheduleViewProps) {
  const t = useTranslations("dashboard.schedule");
  const tc = useTranslations("common");

  const {
    weekDays,
    loading,
    error,
    weekLabel,
    weekOffset,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
  } = useWorkerSchedule({ workerId });

  const swapHook = useShiftSwap({ workerId, centerId });

  return (
    <div>
      <div className="mx-auto max-w-4xl px-6 pt-6 lg:pt-8">
        <PageHeader title={t("pageTitle")} />
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Week navigation */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={goToPreviousWeek}
            aria-label={t("previousWeek")}
          >
            <ChevronLeft />
          </Button>

          <div className="flex min-w-0 flex-col items-center gap-1 sm:flex-row sm:gap-3">
            <p
              aria-live="polite"
              className="text-center text-base font-semibold tabular-nums"
            >
              {weekLabel}
            </p>
            {weekOffset !== 0 && (
              <Button
                variant="outline"
                className="rounded-full"
                onClick={goToCurrentWeek}
              >
                <RefreshCw />
                {t("today")}
              </Button>
            )}
          </div>

          <Button
            variant="secondary"
            size="icon"
            className="shrink-0 rounded-full"
            onClick={goToNextWeek}
            aria-label={t("nextWeek")}
          >
            <ChevronRight />
          </Button>
        </div>

        {/* Error */}
        {error && <Alert variant="error">{error}</Alert>}

        {/* Week grid */}
        <ul className="divide-y overflow-hidden rounded-xl border bg-card shadow-sm">
          {loading
            ? Array.from({ length: 7 }).map((_, i) => (
                <li key={i} className="px-4 py-3">
                  <div className="h-10 animate-pulse rounded-lg bg-track motion-reduce:animate-none" />
                </li>
              ))
            : weekDays.map((day) => (
                <li
                  key={day.date}
                  aria-current={day.isToday ? "date" : undefined}
                  className={cn(
                    "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 px-4 py-3 sm:grid-cols-[9rem_minmax(0,1fr)_auto] sm:gap-x-4",
                    day.isToday
                      ? "bg-brand-soft"
                      : day.isWeekend && "bg-secondary/60"
                  )}
                >
                  {/* Day label */}
                  <p
                    className={cn(
                      "text-sm font-medium first-letter:uppercase",
                      !day.isToday && day.isWeekend && "text-muted-foreground"
                    )}
                  >
                    {day.label}
                    {day.isToday && (
                      <span className="ml-2 text-xs font-semibold text-brand-text">
                        {t("today")}
                      </span>
                    )}
                  </p>

                  {/* Schedule info */}
                  {day.workday ? (
                    <>
                      <dl className="col-span-2 row-start-2 flex flex-wrap gap-x-4 gap-y-1 text-sm sm:col-span-1 sm:col-start-2 sm:row-start-1">
                        <div className="flex gap-1.5">
                          <dt className="text-muted-foreground">
                            {t("entry")}
                          </dt>
                          <dd className="font-medium tabular-nums">
                            {formatHour(day.workday.startWorkday)}
                          </dd>
                        </div>
                        <div className="flex gap-1.5">
                          <dt className="text-muted-foreground">{t("exit")}</dt>
                          <dd className="font-medium tabular-nums">
                            {formatHour(day.workday.endWorkday)}
                          </dd>
                        </div>
                        {day.workday.breakType &&
                          day.workday.breakType !== "none" && (
                            <div className="flex gap-1.5 text-pause-text">
                              <dt>{t("break")}</dt>
                              <dd className="font-medium tabular-nums">
                                {day.workday.breakType === "scheduled"
                                  ? `${formatHour(day.workday.scheduledStartBreak ?? "")} – ${formatHour(day.workday.scheduledEndBreak ?? "")}`
                                  : (tc("free" as never) ??
                                    day.workday.breakType)}
                              </dd>
                            </div>
                          )}
                      </dl>
                      <StatusBadge
                        tone={
                          TYPE_TONES[day.workday.typeDay] ?? TYPE_TONES.normal
                        }
                        size="sm"
                        className="col-start-2 row-start-1 justify-self-end sm:col-start-3"
                      >
                        {day.workday.typeDay in TYPE_LABEL_KEYS
                          ? t(
                              TYPE_LABEL_KEYS[
                                day.workday
                                  .typeDay as keyof typeof TYPE_LABEL_KEYS
                              ]
                            )
                          : day.workday.typeDay}
                      </StatusBadge>
                    </>
                  ) : (
                    <p className="justify-self-end text-sm text-muted-foreground sm:col-span-2 sm:justify-self-start">
                      {t("notScheduled")}
                    </p>
                  )}
                </li>
              ))}
        </ul>

        {/* Swap panel */}
        <ShiftSwapPanel workerId={workerId} swapHook={swapHook} />
      </div>
    </div>
  );
}
