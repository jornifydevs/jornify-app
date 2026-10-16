"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Coffee, Loader2, LogIn, LogOut, Play } from "lucide-react";
import { useTimeTracker } from "../_hooks/useTimeTracker";
import { WorkdayBar } from "./WorkdayBar";
import type { CenterFeature } from "@/core/domain/entities";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";

interface TimeTrackerProps {
  workerId: string;
  enabledFeatures: CenterFeature[];
}

type StatusTone = ComponentProps<typeof StatusBadge>["tone"];

function formatScheduleTime(time: string): string {
  return time.slice(0, 5);
}

function LiveClock({ date, locale }: { date: Date; locale: string }) {
  const parts = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const isMinor = (type?: string) => type === "second" || type === "dayPeriod";

  return (
    <p className="flex items-baseline tabular-nums">
      {parts.map((part, index) => (
        <span
          key={index}
          suppressHydrationWarning
          className={
            isMinor(part.type) ||
            (part.type === "literal" && isMinor(parts[index + 1]?.type))
              ? "whitespace-pre text-[1.75rem] font-medium tracking-[-0.03em] text-muted-foreground"
              : "text-[4.75rem] font-semibold leading-none tracking-[-0.05em]"
          }
        >
          {part.value}
        </span>
      ))}
    </p>
  );
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
    isBeforeSchedule,
    todayWorkday,
    timeline,
    clockedInAt,
    breakStartedAt,
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

  const formatClock = (iso: string) =>
    new Date(iso).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });

  const shiftStart = todayWorkday
    ? formatScheduleTime(todayWorkday.startWorkday)
    : "";
  const shiftEnd = todayWorkday
    ? formatScheduleTime(todayWorkday.endWorkday)
    : "";

  const showBreakButton =
    breakEnabled &&
    isWorking &&
    !breakAlreadyTaken &&
    todayWorkday?.breakType !== "none";

  const status: { tone: StatusTone; label: string } = initializing
    ? { tone: "neutral", label: tc("loading") }
    : isOnBreak && breakStartedAt
      ? {
          tone: "pause",
          label: t("onBreakSince", { time: formatClock(breakStartedAt) }),
        }
      : isWorking && clockedInAt
        ? {
            tone: "live",
            label: t("workingSince", { time: formatClock(clockedInAt) }),
          }
        : isWithinSchedule
          ? { tone: "brand", label: t("shiftStartedAt", { time: shiftStart }) }
          : isBeforeSchedule
            ? { tone: "brand", label: t("shiftStartsAt", { time: shiftStart }) }
            : { tone: "neutral", label: t("offDuty") };

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-alert-soft px-4 py-3 text-sm font-medium text-alert-text"
        >
          {error}
        </div>
      )}

      <section
        aria-label={t("todayLabel")}
        className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
      >
        <StatusBadge tone={status.tone} pulse={status.tone === "live"}>
          {status.label}
        </StatusBadge>

        <div className="space-y-2">
          {isWorking ? (
            <p
              className={cn(
                "text-[3.5rem] font-semibold leading-none tracking-[-0.045em] tabular-nums",
                isOnBreak && "text-pause-text"
              )}
            >
              {formatElapsedTime(isOnBreak ? breakElapsedTime : elapsedTime)}
            </p>
          ) : (
            <LiveClock date={currentTime} locale={locale} />
          )}
          <p
            className="text-sm text-muted-foreground first-letter:uppercase"
            suppressHydrationWarning
          >
            {isWorking
              ? t(isOnBreak ? "breakTime" : "timeWorkedToday")
              : currentTime.toLocaleDateString(locale, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
          </p>
        </div>

        {todayWorkday && timeline && (
          <WorkdayBar
            timeline={timeline}
            startLabel={shiftStart}
            endLabel={shiftEnd}
            label={t("timelineLabel", { start: shiftStart, end: shiftEnd })}
          />
        )}

        {todayWorkday && (
          <dl className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">{t("shift")}</dt>
              <dd className="font-semibold tabular-nums">
                {shiftStart} – {shiftEnd}
              </dd>
            </div>
            {todayWorkday.breakType === "scheduled" &&
              todayWorkday.scheduledStartBreak &&
              todayWorkday.scheduledEndBreak && (
                <div className="flex gap-1.5">
                  <dt className="text-muted-foreground">{t("break")}</dt>
                  <dd className="font-semibold tabular-nums">
                    {formatScheduleTime(todayWorkday.scheduledStartBreak)} –{" "}
                    {formatScheduleTime(todayWorkday.scheduledEndBreak)}
                  </dd>
                </div>
              )}
            {todayWorkday.breakType === "free" && breakEnabled && (
              <div className="flex gap-1.5">
                <dt className="sr-only">{t("break")}</dt>
                <dd className="font-medium text-pause-text">
                  {t("freeBreakAvailable")}
                </dd>
              </div>
            )}
          </dl>
        )}

        {confirmingClockOut ? (
          <div className="space-y-3 rounded-xl bg-secondary p-4">
            <p className="text-[15px] font-semibold">
              {t("confirmClockOutMessage")}
            </p>
            <div className="flex flex-col gap-2">
              <Button size="lg" onClick={handleClockOut} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <LogOut />}
                {t("confirmClockOutYes")}
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={handleCancelClockOut}
                disabled={loading}
              >
                {tc("cancel")}
              </Button>
            </div>
          </div>
        ) : isOnBreak ? (
          <Button
            size="lg"
            variant="brand"
            className="w-full"
            onClick={handleEndBreak}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : <Play />}
            {t("endBreak")}
          </Button>
        ) : isWorking ? (
          <div className="flex flex-col gap-2.5">
            {showBreakButton && (
              <Button
                size="lg"
                variant="pause"
                onClick={handleStartBreak}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : <Coffee />}
                {t("startBreak")}
              </Button>
            )}
            <Button
              size="lg"
              onClick={handleRequestClockOut}
              disabled={loading}
            >
              <LogOut />
              {t("clockOut")}
            </Button>
          </div>
        ) : (
          <Button
            size="lg"
            variant="brand"
            className="w-full"
            onClick={handleClockIn}
            disabled={loading || initializing}
          >
            {loading ? <Loader2 className="animate-spin" /> : <LogIn />}
            {t("clockIn")}
          </Button>
        )}
      </section>
    </div>
  );
}
