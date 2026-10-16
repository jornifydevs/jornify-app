"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Building2,
  Mail,
  Phone,
  FileText,
  Clock,
  Briefcase,
  MoveRight,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExportRangeDropdown from "@/app/dashboard/_components/ExportRangeDropdown";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkerDetailDTO } from "@/core/application/dtos/admin-workers.dto";
import type { Center } from "@/core/domain/entities";
import type { RegistroJornadaMeta } from "@/lib/export-utils";

interface WorkerDetailViewProps {
  detail: WorkerDetailDTO;
  centers: Center[];
  registroMeta?: RegistroJornadaMeta;
}

const dayTypeColors: Record<string, string> = {
  normal: "text-slate-700 dark:text-slate-300",
  holiday: "text-amber-400",
  vacation: "text-emerald-400",
  sick_leave: "text-red-400",
};

function formatDate(dateString: string, locale: string): string {
  return new Date(dateString).toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(dateString: string | undefined, locale: string): string {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WorkerDetailView({
  detail,
  centers,
  registroMeta,
}: WorkerDetailViewProps) {
  const router = useRouter();
  const t = useTranslations("dashboard.admin.workerDetail");
  const tc = useTranslations("common");
  const locale = useLocale();

  const contractLabels: Record<string, string> = {
    full_time: t("contractFull"),
    part_time: t("contractPart"),
    temporary: t("contractTemp"),
    internship: t("contractIntern"),
  };

  const dayTypeLabels: Record<string, string> = {
    normal: t("dayNormal"),
    holiday: t("dayHoliday"),
    vacation: t("dayVacation"),
    sick_leave: t("daySickLeave"),
  };

  const [selectedCenter, setSelectedCenter] = useState(detail.worker.centerId);
  const [moving, setMoving] = useState(false);
  const [moveError, setMoveError] = useState("");
  const [moveSuccess, setMoveSuccess] = useState("");

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleMove = async () => {
    setMoving(true);
    setMoveError("");
    setMoveSuccess("");
    try {
      const res = await fetch(`/api/admin/workers/${detail.worker.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ centerId: selectedCenter }),
      });
      if (!res.ok) {
        const data = await res.json();
        setMoveError(data.error ?? t("errorMove"));
        return;
      }
      setMoveSuccess(t("workerMoved"));
      router.refresh();
    } catch {
      setMoveError(t("errorConnect"));
    } finally {
      setMoving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch(`/api/admin/workers/${detail.worker.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error ?? t("errorDelete"));
        setConfirmDelete(false);
        return;
      }
      router.push("/dashboard/admin/workers");
    } catch {
      setDeleteError(t("errorConnect"));
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 pt-6 lg:pt-8">
        <PageHeader
          title={
            <span className="flex items-center gap-3">
              {detail.userImg && (
                <Image
                  src={detail.userImg}
                  alt=""
                  width={40}
                  height={40}
                  className="rounded-lg object-cover"
                />
              )}
              <span>
                {detail.userName} {detail.userLastName}
              </span>
            </span>
          }
          description={detail.worker.job}
          backHref="/dashboard/admin/workers"
          backLabel={tc("back")}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Email
                  </p>
                  <p className="text-sm text-slate-900 dark:text-white truncate">
                    {detail.userEmail}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("phone")}
                  </p>
                  <p className="text-sm text-slate-900 dark:text-white">
                    {detail.userPhone || t("phoneNotRegistered")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("center")}
                  </p>
                  <p className="text-sm text-slate-900 dark:text-white">
                    {detail.centerName}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("contract")}
                  </p>
                  <p className="text-sm text-slate-900 dark:text-white">
                    {contractLabels[detail.worker.contractType] ??
                      detail.worker.contractType}{" "}
                    · {detail.worker.hourWeek}h/sem
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Worker details */}
        <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  DNI
                </p>
                <p className="text-sm text-slate-900 dark:text-white">
                  {detail.worker.dni}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Move center */}
          <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-sm">
                <MoveRight className="w-4 h-4 text-blue-400" />
                {t("moveCenterTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <select
                value={selectedCenter}
                onChange={(e) => {
                  setSelectedCenter(e.target.value);
                  setMoveSuccess("");
                  setMoveError("");
                }}
                className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:[&>option]:bg-slate-800"
              >
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.id === detail.worker.centerId
                      ? ` ${t("currentCenter")}`
                      : ""}
                  </option>
                ))}
              </select>

              {moveError && <p className="text-xs text-red-400">{moveError}</p>}
              {moveSuccess && (
                <p className="text-xs text-green-400">{moveSuccess}</p>
              )}

              <button
                onClick={handleMove}
                disabled={moving || selectedCenter === detail.worker.centerId}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
              >
                {moving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MoveRight className="w-4 h-4" />
                )}
                {moving ? t("moving") : t("confirmChange")}
              </button>
            </CardContent>
          </Card>

          {/* Delete */}
          <Card className="bg-slate-800/50 border-red-900/40">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-sm">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                {t("dangerZone")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deleteError && (
                <p className="text-xs text-red-400">{deleteError}</p>
              )}

              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-600/40 text-red-400 hover:text-red-300 text-sm font-medium rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {t("deleteWorker")}
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-red-400 font-medium text-center">
                    {t("confirmDeleteWorker", {
                      name: `${detail.userName} ${detail.userLastName}`,
                    })}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {deleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      {deleting ? t("deleting") : t("yesDelete")}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className="flex-1 px-3 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {tc("cancel")}
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Records */}
        <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base">
                <Clock className="w-5 h-5" />
                {t("recentRecords")}
              </CardTitle>
              <ExportRangeDropdown
                workerId={detail.worker.id}
                defaultStart={(() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 30);
                  return d.toISOString().split("T")[0];
                })()}
                defaultEnd={new Date().toISOString().split("T")[0]}
                columns={[
                  t("colDate"),
                  t("colType"),
                  t("colEntry"),
                  t("colExit"),
                  t("colBreak"),
                  t("colTotal"),
                ]}
                buildRow={(record, fd, ft) => [
                  fd(record.workday.day),
                  dayTypeLabels[record.workday.typeDay] ??
                    record.workday.typeDay,
                  ft(record.startHour),
                  ft(record.endHour),
                  record.breakTotalHour ?? "—",
                  record.totalHour ?? "—",
                ]}
                filenameBase={`jornify-trabajador-${detail.userName}-${detail.userLastName}`}
                title={`${detail.userName} ${detail.userLastName} — ${t("recentRecords")}`}
                registroMeta={registroMeta}
              />
            </div>
          </CardHeader>
          <CardContent>
            {detail.recentRecords.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p>{t("noRecords")}</p>
              </div>
            ) : (
              <>
                {/* Mobile list */}
                <div className="block md:hidden space-y-3">
                  {detail.recentRecords.map((record, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-700"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {formatDate(record.day, locale)}
                        </span>
                        <span
                          className={`text-xs ${dayTypeColors[record.typeDay] ?? "text-slate-300"}`}
                        >
                          {dayTypeLabels[record.typeDay] ?? record.typeDay}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                        <span>
                          {formatTime(record.startHour, locale)} —{" "}
                          {formatTime(record.endHour, locale)}
                        </span>
                        <span>{record.totalHour ?? "—"}</span>
                      </div>
                      {record.breakTotalHour && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-amber-400/80">
                            {t("breakLabel")}{" "}
                            {formatTime(record.breakStartHour, locale)} —{" "}
                            {formatTime(record.breakEndHour, locale)}
                          </span>
                          <span className="text-amber-400">
                            {record.breakTotalHour}
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
                      {detail.recentRecords.map((record, idx) => (
                        <TableRow
                          key={idx}
                          className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/30"
                        >
                          <TableCell className="text-slate-900 dark:text-white">
                            {formatDate(record.day, locale)}
                          </TableCell>
                          <TableCell
                            className={
                              dayTypeColors[record.typeDay] ??
                              "text-slate-700 dark:text-slate-300"
                            }
                          >
                            {dayTypeLabels[record.typeDay] ?? record.typeDay}
                          </TableCell>
                          <TableCell className="text-slate-700 dark:text-slate-300">
                            {formatTime(record.startHour, locale)}
                          </TableCell>
                          <TableCell className="text-slate-700 dark:text-slate-300">
                            {formatTime(record.endHour, locale)}
                          </TableCell>
                          <TableCell className="text-amber-400">
                            {record.breakTotalHour ?? "—"}
                          </TableCell>
                          <TableCell className="text-slate-700 dark:text-slate-300 text-right">
                            {record.totalHour ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
