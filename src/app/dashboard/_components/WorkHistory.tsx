"use client";

import { Clock, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useWorkHistory } from "../_hooks/useWorkHistory";
import { useTranslations } from "next-intl";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import ExportRangeDropdown from "./ExportRangeDropdown";
import type { RegistroJornadaMeta } from "@/lib/export-utils";

interface WorkHistoryProps {
  workerId: string;
  registroMeta?: RegistroJornadaMeta;
}

export default function WorkHistory({
  workerId,
  registroMeta,
}: WorkHistoryProps) {
  const {
    records,
    loading,
    filter,
    error,
    setFilter,
    goToPrevious,
    goToNext,
    canGoNext,
    getPeriodLabel,
    getPeriodDates,
    formatTime,
    formatDate,
    calculateTotalHours,
  } = useWorkHistory({ workerId });

  const t = useTranslations("dashboard.history");
  const tc = useTranslations("common");

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
          {/* The export panel opens anchored to the right edge */}
          <div className="ml-auto">
            <ExportRangeDropdown
              workerId={workerId}
              defaultStart={getPeriodDates().start}
              defaultEnd={getPeriodDates().end}
              columns={[
                t("date"),
                t("entry"),
                t("exit"),
                t("break"),
                t("total"),
              ]}
              buildRow={(record, fd, ft) => [
                fd(record.workday.day),
                ft(record.startHour),
                ft(record.endHour),
                record.breakTotalHour ?? "—",
                record.totalHour ?? "00:00:00",
              ]}
              filenameBase="jornify-historial"
              title={t("title")}
              registroMeta={registroMeta}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="group"
            aria-label={t("period")}
            className="flex gap-1 rounded-full bg-secondary p-1 sm:inline-flex"
          >
            {(["today", "week", "month"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={cn(
                  "min-h-11 flex-1 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-9 sm:flex-none",
                  filter === f
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t(f)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              className="shrink-0 rounded-full"
              onClick={goToPrevious}
              aria-label={t("previousPeriod")}
            >
              <ChevronLeft />
            </Button>
            <p
              aria-live="polite"
              className="min-w-0 flex-1 text-center text-sm font-medium tabular-nums first-letter:uppercase sm:min-w-44"
            >
              {getPeriodLabel()}
            </p>
            <Button
              variant="secondary"
              size="icon"
              className="shrink-0 rounded-full"
              onClick={goToNext}
              disabled={!canGoNext}
              aria-label={t("nextPeriod")}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </div>

      {!loading && records.length > 0 && (
        <div className="rounded-xl border bg-card p-4 shadow-sm sm:p-5">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span aria-hidden="true" className="size-2 rounded-full bg-live" />
            {t("totalHours")}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
            {calculateTotalHours()}
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {tc("loading")}
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <Clock
              className="size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="font-medium">{t("noRecords")}</p>
          </div>
        ) : (
          <>
            {/* Column headers from sm up; on phones each value carries its own label */}
            <div
              aria-hidden="true"
              className="hidden grid-cols-5 gap-4 border-b bg-secondary px-5 py-2.5 text-xs font-medium text-muted-foreground sm:grid"
            >
              <span>{t("date")}</span>
              <span>{t("entry")}</span>
              <span>{t("exit")}</span>
              <span>{t("break")}</span>
              <span>{t("total")}</span>
            </div>
            <ul className="divide-y">
              {records.map((record) => (
                <li
                  key={record.id}
                  className="px-4 py-3 transition-colors hover:bg-accent sm:grid sm:grid-cols-5 sm:items-center sm:gap-4 sm:px-5"
                >
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-sm font-medium first-letter:uppercase">
                      {formatDate(record.workday.day)}
                    </p>
                    {record.startHour && !record.endHour && (
                      <StatusBadge tone="live" size="sm">
                        {t("inProgress")}
                      </StatusBadge>
                    )}
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-2 min-[360px]:grid-cols-4 sm:col-span-4 sm:mt-0 sm:gap-4">
                    <div>
                      <dt className="text-xs text-muted-foreground sm:sr-only">
                        {t("entry")}
                      </dt>
                      <dd
                        className={cn(
                          "text-sm tabular-nums",
                          !record.startHour && "text-muted-foreground"
                        )}
                      >
                        {record.startHour ? formatTime(record.startHour) : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground sm:sr-only">
                        {t("exit")}
                      </dt>
                      <dd
                        className={cn(
                          "text-sm tabular-nums",
                          !record.endHour && "text-muted-foreground"
                        )}
                      >
                        {record.endHour ? formatTime(record.endHour) : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground sm:sr-only">
                        {t("break")}
                      </dt>
                      <dd
                        className={cn(
                          "text-sm tabular-nums",
                          record.breakTotalHour
                            ? "text-pause-text"
                            : "text-muted-foreground"
                        )}
                      >
                        {record.breakTotalHour ?? "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground sm:sr-only">
                        {t("total")}
                      </dt>
                      <dd className="text-sm font-semibold tabular-nums">
                        {record.totalHour || "00:00:00"}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
