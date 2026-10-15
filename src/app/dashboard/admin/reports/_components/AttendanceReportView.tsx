"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileBarChart,
  Search,
  Loader2,
  Clock,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAttendanceReport } from "../_hooks/useAttendanceReport";
import { useTranslations, useLocale } from "next-intl";
import ExportButtons from "@/components/ExportButtons";

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
  const tc = useTranslations("common");
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

  const dayTypeColors: Record<string, string> = {
    normal: "text-slate-700 dark:text-slate-300",
    holiday: "text-amber-400",
    vacation: "text-emerald-400",
    sick_leave: "text-red-400",
  };

  void locale;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 relative flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-10 h-10 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600 rounded-lg">
              <FileBarChart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t("title")}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("subtitle")}
              </p>
            </div>
          </div>
          <form action="/auth/signout" method="post" className="ml-auto">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{tc("signOut")}</span>
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Filters */}
        <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="startDate"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    {t("startDate")}
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white border-slate-300 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="endDate"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    {t("endDate")}
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="bg-white border-slate-300 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="center"
                    className="text-slate-700 dark:text-slate-300"
                  >
                    {t("center")}
                  </Label>
                  <select
                    id="center"
                    value={centerId}
                    onChange={(e) => setCenterId(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-white border border-slate-300 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">{t("allCenters")}</option>
                    {centers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    type="submit"
                    disabled={loading || !startDate || !endDate}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        {t("searching")}
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-1" />
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
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        {records.length > 0 && (
          <>
            {/* Summary */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="bg-white/80 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("recordsCount")}
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {records.length}
                </p>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("totalHours")}
                </p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {calculateTotalHours()}
                </p>
              </div>
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

            {/* Table */}
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Mobile cards */}
              <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-700">
                {records.map((r, idx) => (
                  <div key={idx} className="p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900 dark:text-white text-sm">
                        {r.workerName} {r.workerLastName}
                      </span>
                      <span
                        className={`text-xs ${dayTypeColors[r.typeDay] ?? "text-slate-300"}`}
                      >
                        {getDayTypeLabel(r.typeDay)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                      <span>{formatDate(r.day)}</span>
                      <span>{r.centerName}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                      <span>
                        {formatTime(r.startHour)} — {formatTime(r.endHour)}
                      </span>
                      <span className="text-slate-900 dark:text-white">
                        {r.totalHour ?? "—"}
                      </span>
                    </div>
                    {r.breakTotalHour && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-400/80">
                          {t("breakLabel")} {formatTime(r.breakStartHour)} —{" "}
                          {formatTime(r.breakEndHour)}
                        </span>
                        <span className="text-amber-400">
                          {r.breakTotalHour}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 dark:border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-500 dark:text-slate-400">
                        {t("colWorker")}
                      </TableHead>
                      <TableHead className="text-slate-500 dark:text-slate-400">
                        {t("colCenter")}
                      </TableHead>
                      <TableHead className="text-slate-500 dark:text-slate-400">
                        {t("colDate")}
                      </TableHead>
                      <TableHead className="text-slate-500 dark:text-slate-400">
                        {t("colType")}
                      </TableHead>
                      <TableHead className="text-slate-500 dark:text-slate-400">
                        {t("colEntry")}
                      </TableHead>
                      <TableHead className="text-slate-500 dark:text-slate-400">
                        {t("colExit")}
                      </TableHead>
                      <TableHead className="text-slate-500 dark:text-slate-400">
                        {t("colBreak")}
                      </TableHead>
                      <TableHead className="text-slate-500 dark:text-slate-400 text-right">
                        {t("colTotal")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r, idx) => (
                      <TableRow
                        key={idx}
                        className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                      >
                        <TableCell className="text-slate-900 dark:text-white font-medium">
                          {r.workerName} {r.workerLastName}
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">
                          {r.centerName}
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">
                          {formatDate(r.day)}
                        </TableCell>
                        <TableCell
                          className={
                            dayTypeColors[r.typeDay] ??
                            "text-slate-700 dark:text-slate-300"
                          }
                        >
                          {getDayTypeLabel(r.typeDay)}
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">
                          {formatTime(r.startHour)}
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300">
                          {formatTime(r.endHour)}
                        </TableCell>
                        <TableCell className="text-amber-400">
                          {r.breakTotalHour ?? "—"}
                        </TableCell>
                        <TableCell className="text-slate-700 dark:text-slate-300 text-right">
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
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t("noResults")}</p>
          </div>
        )}
      </main>
    </div>
  );
}
