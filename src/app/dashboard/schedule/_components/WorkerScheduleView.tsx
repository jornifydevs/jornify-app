"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useTranslations } from "next-intl";
import UserMenu from "../../_components/UserMenu";
import type { CenterFeature } from "@/core/domain/entities";
import { useWorkerSchedule } from "../_hooks/useWorkerSchedule";
import { useShiftSwap } from "../_hooks/useShiftSwap";
import ShiftSwapPanel from "./ShiftSwapPanel";

interface WorkerScheduleViewProps {
  workerId: string;
  centerId: string;
  userEmail: string;
  enabledFeatures: CenterFeature[];
}

const TYPE_STYLES: Record<string, string> = {
  normal:
    "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300",
  holiday: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  vacation: "bg-orange-500/10 text-orange-600 dark:text-orange-300",
  sick_leave: "bg-red-500/10 text-red-600 dark:text-red-300",
};

function formatHour(time: string): string {
  return time.slice(0, 5);
}

export default function WorkerScheduleView({
  workerId,
  centerId,
  userEmail,
  enabledFeatures,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center justify-center w-10 h-10 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-600 rounded-lg">
                <CalendarClock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t("pageTitle")}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>
          <UserMenu enabledFeatures={enabledFeatures} />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
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
                {t("today")}
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

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Week grid */}
        <div className="space-y-2">
          {loading
            ? Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-200 dark:bg-slate-700/50 rounded-xl animate-pulse"
                />
              ))
            : weekDays.map((day) => (
                <div
                  key={day.date}
                  className={`rounded-xl border p-4 transition-colors ${
                    day.isToday
                      ? "border-orange-500/50 bg-orange-500/5 dark:bg-orange-500/10"
                      : day.isWeekend
                        ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 opacity-70"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Day label */}
                    <div className="w-28 shrink-0">
                      <p
                        className={`text-sm font-medium capitalize ${
                          day.isToday
                            ? "text-orange-600 dark:text-orange-400"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {day.label}
                        {day.isToday && (
                          <span className="ml-1 text-xs font-normal text-orange-500">
                            ({t("today")})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Schedule info */}
                    {day.workday ? (
                      <div className="flex items-center gap-4 flex-1 flex-wrap">
                        <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                          <span className="text-xs text-slate-400">
                            {t("entry")}
                          </span>
                          <span className="font-mono font-medium">
                            {formatHour(day.workday.startWorkday)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                          <span className="text-xs text-slate-400">
                            {t("exit")}
                          </span>
                          <span className="font-mono font-medium">
                            {formatHour(day.workday.endWorkday)}
                          </span>
                        </div>
                        {day.workday.breakType &&
                          day.workday.breakType !== "none" && (
                            <div className="text-xs text-slate-400">
                              {t("break")}:{" "}
                              {day.workday.breakType === "scheduled"
                                ? `${formatHour(day.workday.scheduledStartBreak ?? "")} – ${formatHour(day.workday.scheduledEndBreak ?? "")}`
                                : (tc("free" as never) ??
                                  day.workday.breakType)}
                            </div>
                          )}
                        <span
                          className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                            TYPE_STYLES[day.workday.typeDay] ??
                            TYPE_STYLES.normal
                          }`}
                        >
                          {t(
                            `type${day.workday.typeDay.charAt(0).toUpperCase() + day.workday.typeDay.slice(1).replace("_", "")}` as never
                          ) ?? day.workday.typeDay}
                        </span>
                      </div>
                    ) : (
                      <p className="flex-1 text-sm text-slate-400 dark:text-slate-500 italic">
                        {t("notScheduled")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
        </div>

        {/* Swap panel */}
        <ShiftSwapPanel workerId={workerId} swapHook={swapHook} />
      </main>
    </div>
  );
}
