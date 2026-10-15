"use client";

import { Button } from "@/components/ui/button";
import {
  Clock,
  LogIn,
  LogOut,
  Loader2,
  Coffee,
  Play,
  CalendarClock,
} from "lucide-react";
import { useTimeTracker } from "../_hooks/useTimeTracker";
import type { CenterFeature } from "@/core/domain/entities";
import { useTranslations, useLocale } from "next-intl";

interface TimeTrackerProps {
  workerId: string;
  enabledFeatures: CenterFeature[];
}

function formatScheduleTime(time: string): string {
  return time.slice(0, 5);
}

export default function TimeTracker({
  workerId,
  enabledFeatures,
}: TimeTrackerProps) {
  const {
    currentTime,
    isWorking,
    isOnBreak,
    initializing,
    confirmingClockOut,
    loading,
    error,
    elapsedTime,
    breakElapsedTime,
    breakEnabled,
    breakAlreadyTaken,
    isWithinSchedule,
    todayWorkday,
    handleClockIn,
    handleRequestClockOut,
    handleCancelClockOut,
    handleClockOut,
    handleStartBreak,
    handleEndBreak,
    formatElapsedTime,
  } = useTimeTracker({ workerId, enabledFeatures });

  const t = useTranslations("dashboard.timeTracker");
  const tc = useTranslations("common");
  const locale = useLocale();

  const showBreakButton =
    breakEnabled &&
    isWorking &&
    !breakAlreadyTaken &&
    todayWorkday?.breakType !== "none";

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Current Time Display */}
      <div className="text-center">
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/80 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <Clock className="w-5 h-5 text-blue-400" />
          <span
            className="text-5xl font-mono font-bold text-slate-900 dark:text-white"
            suppressHydrationWarning
          >
            {currentTime.toLocaleTimeString(locale)}
          </span>
        </div>
        <p
          className="mt-2 text-xl text-slate-500 dark:text-slate-400"
          suppressHydrationWarning
        >
          {currentTime.toLocaleDateString(locale, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Schedule Info */}
      {todayWorkday && (
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarClock className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("scheduleTitle")}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900/50 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {t("entry")}
              </span>
              <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white">
                {formatScheduleTime(todayWorkday.startWorkday)}
              </span>
            </div>
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900/50 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {t("exit")}
              </span>
              <span className="text-sm font-mono font-semibold text-slate-900 dark:text-white">
                {formatScheduleTime(todayWorkday.endWorkday)}
              </span>
            </div>
            {todayWorkday.breakType === "scheduled" &&
              todayWorkday.scheduledStartBreak &&
              todayWorkday.scheduledEndBreak && (
                <>
                  <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900/50 rounded-lg px-3 py-2">
                    <span className="text-xs text-slate-500">
                      {t("breakFrom")}
                    </span>
                    <span className="text-sm font-mono font-semibold text-amber-400">
                      {formatScheduleTime(todayWorkday.scheduledStartBreak)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-900/50 rounded-lg px-3 py-2">
                    <span className="text-xs text-slate-500">
                      {t("breakUntil")}
                    </span>
                    <span className="text-sm font-mono font-semibold text-amber-400">
                      {formatScheduleTime(todayWorkday.scheduledEndBreak)}
                    </span>
                  </div>
                </>
              )}
            {todayWorkday.breakType === "free" && breakEnabled && (
              <div className="col-span-2 flex items-center justify-center bg-slate-100 dark:bg-slate-900/50 rounded-lg px-3 py-2">
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  {t("freeBreakAvailable")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Card */}
      <div className="bg-gradient-to-br from-white/80 to-slate-50/50 dark:from-slate-800/50 dark:to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-8">
        <div className="text-center space-y-6">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
              {t("currentStatus")}
            </p>
            {initializing ? (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-200 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600">
                <Loader2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 animate-spin" />
                <span className="font-semibold text-slate-400 dark:text-slate-500">
                  {tc("loading")}
                </span>
              </div>
            ) : (
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  isOnBreak
                    ? "bg-amber-500/20 border border-amber-500/50"
                    : isWorking
                      ? "bg-green-500/20 border border-green-500/50"
                      : isWithinSchedule
                        ? "bg-blue-500/20 border border-blue-500/50"
                        : "bg-slate-200 dark:bg-slate-700/50 border border-slate-300 dark:border-slate-600"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isOnBreak
                      ? "bg-amber-400 animate-pulse"
                      : isWorking
                        ? "bg-green-400 animate-pulse"
                        : isWithinSchedule
                          ? "bg-blue-400"
                          : "bg-slate-400 dark:bg-slate-500"
                  }`}
                />
                <span
                  className={`font-semibold ${
                    isOnBreak
                      ? "text-amber-400"
                      : isWorking
                        ? "text-green-400"
                        : isWithinSchedule
                          ? "text-blue-400"
                          : "text-slate-400"
                  }`}
                >
                  {isOnBreak
                    ? t("onBreak")
                    : isWorking
                      ? t("working")
                      : isWithinSchedule
                        ? t("withinSchedule")
                        : t("offDuty")}
                </span>
              </div>
            )}
          </div>

          {isWorking && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                  {t("timeWorkedToday")}
                </p>
                <p className="text-5xl font-mono font-bold text-blue-400">
                  {formatElapsedTime(elapsedTime)}
                </p>
              </div>

              {isOnBreak && (
                <div>
                  <p className="text-sm text-amber-400/80 mb-1">
                    {t("breakTime")}
                  </p>
                  <p className="text-2xl font-mono font-bold text-amber-400">
                    {formatElapsedTime(breakElapsedTime)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Break Button */}
          {showBreakButton && (
            <Button
              onClick={isOnBreak ? handleEndBreak : handleStartBreak}
              disabled={loading}
              className={`w-full py-6 text-base font-semibold rounded-xl shadow-lg transition-all duration-200 ${
                isOnBreak
                  ? "bg-green-600 hover:bg-green-700 shadow-green-500/30"
                  : "bg-amber-600 hover:bg-amber-700 shadow-amber-500/30"
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isOnBreak ? (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  {t("endBreak")}
                </>
              ) : (
                <>
                  <Coffee className="w-5 h-5 mr-2" />
                  {t("startBreak")}
                </>
              )}
            </Button>
          )}

          {/* Clock In/Out Button */}
          {confirmingClockOut ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium text-center">
                {t("confirmClockOutMessage")}
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleClockOut}
                  disabled={loading}
                  className="flex-1 py-6 text-base font-semibold rounded-xl bg-red-600 hover:bg-red-700 shadow-red-500/30 shadow-lg"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <LogOut className="w-5 h-5 mr-2" />
                      {t("confirmClockOutYes")}
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleCancelClockOut}
                  disabled={loading}
                  className="flex-1 py-6 text-base font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-white"
                >
                  {tc("cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={isWorking ? handleRequestClockOut : handleClockIn}
              disabled={loading || isOnBreak || initializing}
              className={`w-full py-8 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 ${
                isWorking
                  ? "bg-red-600 hover:bg-red-700 shadow-red-500/30"
                  : "bg-green-600 hover:bg-green-700 shadow-green-500/30"
              } ${isOnBreak ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  {isWorking ? (
                    <>
                      <LogOut className="w-6 h-6 mr-2" />
                      {t("clockOut")}
                    </>
                  ) : (
                    <>
                      <LogIn className="w-6 h-6 mr-2" />
                      {t("clockIn")}
                    </>
                  )}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
