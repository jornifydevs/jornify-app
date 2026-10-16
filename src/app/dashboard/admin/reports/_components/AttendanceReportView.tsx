"use client";

import { useState, type ComponentProps } from "react";
import { Search, Loader2, Clock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useAttendanceReport } from "../_hooks/useAttendanceReport";
import { useTranslations, useLocale } from "next-intl";
import ExportButtons from "@/components/ExportButtons";

type BadgeTone = NonNullable<ComponentProps<typeof StatusBadge>["tone"]>;

const DAY_TYPE_TONES: Record<string, BadgeTone> = {
  normal: "neutral",
  holiday: "brand",
  vacation: "pause",
  sick_leave: "alert",
};

interface AttendanceReportViewProps {
  centers: { id: string; name: string }[];
  companyId: string;
}

export default function AttendanceReportView({
  centers,
  companyId,
}: AttendanceReportViewProps) {
  const [today] = useState(() => new Date().toISOString().split("T")[0]);
  const [weekAgo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });

  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [centerId, setCenterId] = useState("");

  const t = useTranslations("dashboard.admin.reports");
  const locale = useLocale();

  const {
    records,
    loading,
    error,
    fetchReport,
    formatDate,
    formatTime,
    getDayTypeLabel,
    calculateTotalHours,
  } = useAttendanceReport();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (startDate && endDate) {
      fetchReport(companyId, startDate, endDate, centerId);
    }
  };

  void locale;

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 pt-6 lg:pt-8">
        <PageHeader title={t("title")} description={t("subtitle")} />
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">{t("startDate")}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="tabular-nums"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">{t("endDate")}</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="tabular-nums"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="center">{t("center")}</Label>
                  <NativeSelect
                    id="center"
                    value={centerId}
                    onChange={(e) => setCenterId(e.target.value)}
                  >
                    <option value="">{t("allCenters")}</option>
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={loading || !startDate || !endDate}
                    className="h-12 w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" />
                        {t("searching")}
                      </>
                    ) : (
                      <>
                        <Search />
                        {t("search")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error */}
        {error && <Alert variant="error">{error}</Alert>}

        {/* Results */}
        {records.length > 0 && (
          <>
            {/* Summary */}
            <div className="flex flex-wrap items-end gap-3 sm:gap-4">
              <div className="min-w-36 flex-1 rounded-xl border bg-card px-4 py-3 shadow-sm sm:flex-none sm:px-5 sm:py-4">
                <p className="text-sm text-muted-foreground">
                  {t("recordsCount")}
                </p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
                  {records.length}
                </p>
              </div>
              <div className="min-w-36 flex-1 rounded-xl border bg-card px-4 py-3 shadow-sm sm:flex-none sm:px-5 sm:py-4">
                <p className="text-sm text-muted-foreground">
                  {t("totalHours")}
                </p>
                <p className="text-2xl font-semibold tracking-tight tabular-nums sm:text-3xl">
                  {calculateTotalHours()}
                </p>
              </div>
              <div className="sm:ml-auto">
                <ExportButtons
                  columns={[
                    t("colWorker"),
                    t("colCenter"),
                    t("colDate"),
                    t("colType"),
                    t("colEntry"),
                    t("colExit"),
                    t("colBreak"),
                    t("colTotal"),
                  ]}
                  rows={records.map((r) => [
                    `${r.workerName} ${r.workerLastName}`,
                    r.centerName,
                    formatDate(r.day),
                    getDayTypeLabel(r.typeDay),
                    formatTime(r.startHour),
                    formatTime(r.endHour),
                    r.breakTotalHour ?? "—",
                    r.totalHour ?? "—",
                  ])}
                  filename={`jornify-reporte-${startDate}-${endDate}`}
                  title={`${t("title")} ${startDate} — ${endDate}`}
                  disabled={records.length === 0}
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
              {/* Mobile cards */}
              <ul className="divide-y md:hidden">
                {records.map((r, idx) => (
                  <li key={idx} className="space-y-1.5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-sm font-medium">
                        {r.workerName} {r.workerLastName}
                      </span>
                      <StatusBadge
                        size="sm"
                        tone={DAY_TYPE_TONES[r.typeDay] ?? "neutral"}
                      >
                        {getDayTypeLabel(r.typeDay)}
                      </StatusBadge>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                      <span>{formatDate(r.day)}</span>
                      <span className="truncate">{r.centerName}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
                      <span className="tabular-nums">
                        {formatTime(r.startHour)} — {formatTime(r.endHour)}
                      </span>
                      <span className="font-medium text-foreground tabular-nums">
                        {r.totalHour ?? "—"}
                      </span>
                    </div>
                    {r.breakTotalHour && (
                      <div className="flex items-center justify-between gap-3 text-sm text-pause-text">
                        <span className="tabular-nums">
                          {t("breakLabel")} {formatTime(r.breakStartHour)} —{" "}
                          {formatTime(r.breakEndHour)}
                        </span>
                        <span className="font-medium tabular-nums">
                          {r.breakTotalHour}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary hover:bg-secondary">
                      <TableHead className="pl-4">{t("colWorker")}</TableHead>
                      <TableHead>{t("colCenter")}</TableHead>
                      <TableHead>{t("colDate")}</TableHead>
                      <TableHead>{t("colType")}</TableHead>
                      <TableHead>{t("colEntry")}</TableHead>
                      <TableHead>{t("colExit")}</TableHead>
                      <TableHead>{t("colBreak")}</TableHead>
                      <TableHead className="pr-4 text-right">
                        {t("colTotal")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="pl-4 font-medium">
                          {r.workerName} {r.workerLastName}
                        </TableCell>
                        <TableCell>{r.centerName}</TableCell>
                        <TableCell>{formatDate(r.day)}</TableCell>
                        <TableCell>
                          <StatusBadge
                            size="sm"
                            tone={DAY_TYPE_TONES[r.typeDay] ?? "neutral"}
                          >
                            {getDayTypeLabel(r.typeDay)}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatTime(r.startHour)}
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatTime(r.endHour)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "tabular-nums",
                            r.breakTotalHour
                              ? "text-pause-text"
                              : "text-muted-foreground"
                          )}
                        >
                          {r.breakTotalHour ?? "—"}
                        </TableCell>
                        <TableCell className="pr-4 text-right font-medium tabular-nums">
                          {r.totalHour ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        {/* Empty state after search */}
        {!loading && records.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Clock
              className="size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("noResults")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
