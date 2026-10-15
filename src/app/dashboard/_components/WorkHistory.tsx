"use client";

import { Calendar, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useWorkHistory } from "../_hooks/useWorkHistory";
import { useTranslations } from "next-intl";
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
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            {t("title")}
          </h3>
          <div className="flex gap-2 flex-wrap">
            {(["today", "week", "month"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                {t(f)}
              </button>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-center gap-4">
          <button
            onClick={goToPrevious}
            className="p-2 rounded-lg bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors"
            aria-label={t("previousPeriod")}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[180px] text-center capitalize">
            {getPeriodLabel()}
          </span>
          <button
            onClick={goToNext}
            disabled={!canGoNext}
            className={`p-2 rounded-lg transition-colors ${
              canGoNext
                ? "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                : "bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800 dark:text-slate-600"
            }`}
            aria-label={t("nextPeriod")}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute right-0">
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
      </div>

      {!loading && records.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {t("totalHours")}
            </span>
            <span className="text-2xl font-bold text-blue-400">
              {calculateTotalHours()}
            </span>
          </div>
        </div>
      )}

      <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            {tc("loading")}
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            {t("noRecords")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("date")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("entry")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("exit")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("break")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("total")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {records.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-900 dark:text-white">
                          {formatDate(record.workday.day)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {record.startHour && formatTime(record.startHour)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {record.endHour && formatTime(record.endHour)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-amber-400">
                        {record.breakTotalHour ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-blue-400">
                        {record.totalHour || "00:00:00"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
