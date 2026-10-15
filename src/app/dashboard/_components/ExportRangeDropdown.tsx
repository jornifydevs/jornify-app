"use client";

import { useState, useEffect, useRef } from "react";
import { Download, ChevronDown, FileDown, Table2, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { createClient } from "@/infrastructure/supabase/client";
import { SupabaseWorkdayRepository } from "@/infrastructure/supabase/repositories/supabase-workday.repository";
import { SupabaseTimeRecordRepository } from "@/infrastructure/supabase/repositories/supabase-time-record.repository";
import { ExportWorkHistoryUseCase } from "@/core/application/use-cases/time-tracking/export-work-history.use-case";
import type { TimeRecordWithWorkday } from "@/core/application/dtos/work-history.dto";
import {
  downloadCSV,
  downloadPDF,
  downloadRegistroJornada,
  type RegistroJornadaMeta,
} from "@/lib/export-utils";

type BuildRowFn = (
  record: TimeRecordWithWorkday,
  formatDate: (d: string) => string,
  formatTime: (d: string | undefined) => string
) => string[];

interface ExportRangeDropdownProps {
  workerId: string;
  defaultStart: string;
  defaultEnd: string;
  columns: string[];
  buildRow: BuildRowFn;
  filenameBase: string;
  title?: string;
  registroMeta?: RegistroJornadaMeta;
}

export default function ExportRangeDropdown({
  workerId,
  defaultStart,
  defaultEnd,
  columns,
  buildRow,
  filenameBase,
  title,
  registroMeta,
}: ExportRangeDropdownProps) {
  const t = useTranslations("common.export");
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync dates when the visible period changes
  useEffect(() => {
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
  }, [defaultStart, defaultEnd]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fetchAndExport = async (type: "pdf" | "csv") => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const supabase = createClient();
      const workdayRepo = new SupabaseWorkdayRepository(supabase);
      const timeRecordRepo = new SupabaseTimeRecordRepository(supabase);
      const useCase = new ExportWorkHistoryUseCase(workdayRepo, timeRecordRepo);
      const records = await useCase.execute(workerId, startDate, endDate);

      if (records.length === 0) {
        setStatusMsg(t("noData"));
        return;
      }

      const filename = `${filenameBase}-${startDate}-${endDate}`;

      if (type === "pdf" && registroMeta) {
        const registroRows = records.map((r) => ({
          date: formatDate(r.workday.day),
          entry: formatTime(r.startHour),
          exit: formatTime(r.endHour),
          breakStart: formatTime(r.breakStartHour),
          breakEnd: formatTime(r.breakEndHour),
          breakTotal: r.breakTotalHour ?? "—",
          total: r.totalHour ?? "—",
          signed: r.workday.digitalSignature ?? false,
        }));
        const tr = t.raw("registro") as Record<string, string>;
        await downloadRegistroJornada(
          registroMeta,
          registroRows,
          startDate,
          endDate,
          filename,
          {
            title: tr.title,
            period: tr.period,
            company: tr.company,
            nif: tr.nif,
            ccc: tr.ccc,
            worker: tr.worker,
            dni: tr.dni,
            nss: tr.nss,
            date: tr.date,
            entry: tr.entry,
            exit: tr.exit,
            breakStart: tr.breakStart,
            breakEnd: tr.breakEnd,
            breakTotal: tr.breakTotal,
            totalHours: tr.totalHours,
            signature: tr.signature,
            signedYes: tr.signedYes,
            signedNo: tr.signedNo,
            signatureBlock: tr.signatureBlock,
            workerSignature: tr.workerSignature,
            companySignature: tr.companySignature,
            grandTotal: tr.grandTotal,
          }
        );
      } else if (type === "pdf") {
        const rows = records.map((r) => buildRow(r, formatDate, formatTime));
        await downloadPDF(columns, rows, filename, title);
      } else {
        const rows = records.map((r) => buildRow(r, formatDate, formatTime));
        downloadCSV(columns, rows, filename);
      }

      setOpen(false);
    } catch {
      setStatusMsg(t("fetchError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        className="gap-1.5"
      >
        <Download className="w-4 h-4" />
        {t("trigger")}
        <ChevronDown className="w-3.5 h-3.5" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-3 space-y-3">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {t("rangeTitle")}
          </p>

          <div className="space-y-2">
            <div className="space-y-1">
              <label className="text-xs text-slate-600 dark:text-slate-400">
                {t("from")}
              </label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setStatusMsg(null);
                }}
                className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 px-2 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-600 dark:text-slate-400">
                {t("to")}
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setStatusMsg(null);
                }}
                className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 px-2 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {statusMsg && <p className="text-xs text-amber-500">{statusMsg}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => fetchAndExport("pdf")}
              disabled={loading || !startDate || !endDate}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              {t("pdf")}
            </button>
            <button
              onClick={() => fetchAndExport("csv")}
              disabled={loading || !startDate || !endDate}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Table2 className="w-3.5 h-3.5" />
              )}
              {t("csv")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
