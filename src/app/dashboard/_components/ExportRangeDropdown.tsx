"use client";

import { useState, useEffect, useRef, useId } from "react";
import { Download, ChevronDown, FileDown, Table2, Loader2 } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
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
  const fieldId = useId();

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
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="px-3.5 sm:px-5"
      >
        <Download />
        <span className="sr-only sm:not-sr-only">{t("trigger")}</span>
        <ChevronDown
          className={cn(
            "transition-transform motion-reduce:transition-none",
            open && "rotate-180"
          )}
        />
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] space-y-4 rounded-xl border bg-popover p-4 text-popover-foreground shadow-float">
          <p className="text-sm font-semibold">{t("rangeTitle")}</p>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-from`}>{t("from")}</Label>
              <Input
                id={`${fieldId}-from`}
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setStatusMsg(null);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-to`}>{t("to")}</Label>
              <Input
                id={`${fieldId}-to`}
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setStatusMsg(null);
                }}
              />
            </div>
          </div>

          {statusMsg && <Alert variant="warning">{statusMsg}</Alert>}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchAndExport("pdf")}
              disabled={loading || !startDate || !endDate}
              className="flex-1"
            >
              {loading ? <Loader2 className="animate-spin" /> : <FileDown />}
              {t("pdf")}
            </Button>
            <Button
              variant="outline"
              onClick={() => fetchAndExport("csv")}
              disabled={loading || !startDate || !endDate}
              className="flex-1"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Table2 />}
              {t("csv")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
