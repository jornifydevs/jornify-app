"use client";

import Image from "next/image";
import { useState, type ComponentProps, type ReactNode } from "react";
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
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { StatusBadge } from "@/components/ui/status-badge";
import ExportRangeDropdown from "@/app/dashboard/_components/ExportRangeDropdown";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { WorkerDetailDTO } from "@/core/application/dtos/admin-workers.dto";
import type { Center } from "@/core/domain/entities";
import type { RegistroJornadaMeta } from "@/lib/export-utils";

interface WorkerDetailViewProps {
  detail: WorkerDetailDTO;
  centers: Center[];
  registroMeta?: RegistroJornadaMeta;
}

type StatusTone = ComponentProps<typeof StatusBadge>["tone"];

const dayTypeTones: Record<string, StatusTone> = {
  normal: "neutral",
  holiday: "brand",
  vacation: "pause",
  sick_leave: "alert",
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

function InfoItem({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: LucideIcon;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon aria-hidden="true" className="size-4 shrink-0" />
        {label}
      </dt>
      <dd className={cn("break-words font-medium", className)}>{children}</dd>
    </div>
  );
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
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* Worker details */}
        <Card>
          <CardContent className="p-5 sm:p-6">
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <InfoItem icon={Mail} label={t("email")}>
                {detail.userEmail}
              </InfoItem>
              <InfoItem
                icon={Phone}
                label={t("phone")}
                className={cn(
                  !detail.userPhone && "font-normal text-muted-foreground"
                )}
              >
                {detail.userPhone || t("phoneNotRegistered")}
              </InfoItem>
              <InfoItem icon={Building2} label={t("center")}>
                {detail.centerName}
              </InfoItem>
              <InfoItem icon={Briefcase} label={t("contract")}>
                {contractLabels[detail.worker.contractType] ??
                  detail.worker.contractType}{" "}
                ·{" "}
                <span className="tabular-nums">
                  {t("hoursPerWeek", { hours: detail.worker.hourWeek })}
                </span>
              </InfoItem>
              <InfoItem icon={FileText} label={t("dni")}>
                {detail.worker.dni}
              </InfoItem>
            </dl>
          </CardContent>
        </Card>

        {/* Management */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Move center */}
          <Card>
            <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <MoveRight
                  aria-hidden="true"
                  className="size-5 text-muted-foreground"
                />
                {t("moveCenterTitle")}
              </h2>
            </CardHeader>
            <CardContent className="space-y-3 p-5 pt-0 sm:p-6 sm:pt-0">
              <NativeSelect
                aria-label={t("moveCenterTitle")}
                value={selectedCenter}
                onChange={(e) => {
                  setSelectedCenter(e.target.value);
                  setMoveSuccess("");
                  setMoveError("");
                }}
              >
                {centers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.id === detail.worker.centerId
                      ? ` ${t("currentCenter")}`
                      : ""}
                  </option>
                ))}
              </NativeSelect>

              {moveError && <Alert variant="error">{moveError}</Alert>}
              {moveSuccess && <Alert variant="success">{moveSuccess}</Alert>}

              <Button
                type="button"
                onClick={handleMove}
                disabled={moving || selectedCenter === detail.worker.centerId}
                className="w-full"
              >
                {moving ? <Loader2 className="animate-spin" /> : <MoveRight />}
                {moving ? t("moving") : t("confirmChange")}
              </Button>
            </CardContent>
          </Card>

          {/* Delete */}
          <Card className="border-destructive/30">
            <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <AlertTriangle
                  aria-hidden="true"
                  className="size-5 text-muted-foreground"
                />
                {t("dangerZone")}
              </h2>
            </CardHeader>
            <CardContent className="space-y-3 p-5 pt-0 sm:p-6 sm:pt-0">
              {deleteError && <Alert variant="error">{deleteError}</Alert>}

              {!confirmDelete ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full border-destructive/40 text-alert-text hover:bg-alert-soft hover:text-alert-text"
                >
                  <Trash2 />
                  {t("deleteWorker")}
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-center text-sm font-medium text-alert-text">
                    {t("confirmDeleteWorker", {
                      name: `${detail.userName} ${detail.userLastName}`,
                    })}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1"
                    >
                      {deleting ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Trash2 />
                      )}
                      {deleting ? t("deleting") : t("yesDelete")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setConfirmDelete(false)}
                      disabled={deleting}
                      className="flex-1"
                    >
                      {tc("cancel")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Records */}
        <Card>
          <CardHeader className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <Clock
                  aria-hidden="true"
                  className="size-5 text-muted-foreground"
                />
                {t("recentRecords")}
              </h2>
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
          <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
            {detail.recentRecords.length === 0 ? (
              <div className="py-8 text-center">
                <Clock
                  aria-hidden="true"
                  className="mx-auto mb-3 size-10 text-muted-foreground"
                />
                <p className="font-medium">{t("noRecords")}</p>
              </div>
            ) : (
              <>
                {/* Mobile list */}
                <ul className="space-y-2 md:hidden">
                  {detail.recentRecords.map((record, idx) => (
                    <li
                      key={idx}
                      className="space-y-1.5 rounded-lg bg-secondary p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          {formatDate(record.day, locale)}
                        </span>
                        <StatusBadge
                          tone={dayTypeTones[record.typeDay] ?? "neutral"}
                          size="sm"
                          dot={false}
                        >
                          {dayTypeLabels[record.typeDay] ?? record.typeDay}
                        </StatusBadge>
                      </div>
                      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground tabular-nums">
                        <span>
                          {formatTime(record.startHour, locale)} —{" "}
                          {formatTime(record.endHour, locale)}
                        </span>
                        <span className="font-medium text-foreground">
                          {record.totalHour ?? "—"}
                        </span>
                      </div>
                      {record.breakTotalHour && (
                        <div className="flex items-center justify-between gap-2 text-sm text-pause-text tabular-nums">
                          <span>
                            {t("breakLabel")}{" "}
                            {formatTime(record.breakStartHour, locale)} —{" "}
                            {formatTime(record.breakEndHour, locale)}
                          </span>
                          <span className="font-medium">
                            {record.breakTotalHour}
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
                      <TableRow className="hover:bg-transparent">
                        <TableHead>{t("colDate")}</TableHead>
                        <TableHead>{t("colType")}</TableHead>
                        <TableHead>{t("colEntry")}</TableHead>
                        <TableHead>{t("colExit")}</TableHead>
                        <TableHead>{t("colBreak")}</TableHead>
                        <TableHead className="text-right">
                          {t("colTotal")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.recentRecords.map((record, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {formatDate(record.day, locale)}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              tone={dayTypeTones[record.typeDay] ?? "neutral"}
                              size="sm"
                              dot={false}
                            >
                              {dayTypeLabels[record.typeDay] ?? record.typeDay}
                            </StatusBadge>
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {formatTime(record.startHour, locale)}
                          </TableCell>
                          <TableCell className="tabular-nums">
                            {formatTime(record.endHour, locale)}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "tabular-nums",
                              record.breakTotalHour
                                ? "text-pause-text"
                                : "text-muted-foreground"
                            )}
                          >
                            {record.breakTotalHour ?? "—"}
                          </TableCell>
                          <TableCell className="text-right font-medium tabular-nums">
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
