"use client";

import { useState, useEffect, useId } from "react";
import { X, Send } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { Worker, Workday } from "@/core/domain/entities";
import type { RequestShiftSwapInput } from "@/core/application/dtos/shifts.dto";

interface ShiftSwapRequestModalProps {
  coworkers: Worker[];
  myWorkdays: Workday[];
  targetWorkdays: Workday[];
  loadingData: boolean;
  loadingTargetWorkdays: boolean;
  submitting: boolean;
  onLoadTargetWorkdays: (targetWorkerId: string) => void;
  onSubmit: (
    input: Omit<RequestShiftSwapInput, "requesterId">
  ) => Promise<boolean>;
  onClose: () => void;
}

function groupByMonth(workdays: Workday[]): Map<string, Workday[]> {
  const map = new Map<string, Workday[]>();
  for (const w of workdays) {
    const key = w.day.slice(0, 7); // "YYYY-MM"
    const group = map.get(key) ?? [];
    group.push(w);
    map.set(key, group);
  }
  return map;
}

function formatMonthKey(key: string, locale: string): string {
  const date = new Date(key + "-01T00:00:00");
  const month = date.toLocaleDateString(locale, { month: "long" });
  return `${month} ${date.getFullYear()}`;
}

function formatDay(workday: Workday, locale: string): string {
  const date = new Date(workday.day + "T00:00:00");
  const dayLabel = date.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
  });
  return `${dayLabel} · ${workday.startWorkday.slice(0, 5)}–${workday.endWorkday.slice(0, 5)}`;
}

interface WorkdayPickerProps {
  label: string;
  workdays: Workday[];
  selectedId: string;
  onSelect: (id: string) => void;
  placeholder: string;
  noWorkdaysText: string;
}

function WorkdayPicker({
  label,
  workdays,
  selectedId,
  onSelect,
  placeholder,
  noWorkdaysText,
}: WorkdayPickerProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard.schedule.swaps");
  const byMonth = groupByMonth(workdays);
  const monthKeys = Array.from(byMonth.keys());

  const selectedWorkday = workdays.find((w) => w.id === selectedId);
  const selectedMonth = selectedWorkday ? selectedWorkday.day.slice(0, 7) : "";

  const [activeMonth, setActiveMonth] = useState(monthKeys[0] ?? "");

  // Reset active month when workdays list changes (new coworker selected)
  useEffect(() => {
    setActiveMonth(monthKeys[0] ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workdays.length]);

  const handleMonthChange = (month: string) => {
    setActiveMonth(month);
    // Clear selection if selected day is not in new month
    if (selectedMonth && selectedMonth !== month) {
      onSelect("");
    }
  };

  const daysInMonth = byMonth.get(activeMonth) ?? [];

  if (workdays.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{noWorkdaysText}</p>
      </div>
    );
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Month select */}
        <NativeSelect
          aria-label={t("month")}
          value={activeMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="capitalize sm:w-2/5"
        >
          {monthKeys.map((key) => (
            <option key={key} value={key}>
              {formatMonthKey(key, locale)}
            </option>
          ))}
        </NativeSelect>

        {/* Day select */}
        <NativeSelect
          aria-label={t("day")}
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          required
          className="sm:flex-1"
        >
          <option value="">{placeholder}</option>
          {daysInMonth.map((w) => (
            <option key={w.id} value={w.id}>
              {formatDay(w, locale)}
            </option>
          ))}
        </NativeSelect>
      </div>
    </fieldset>
  );
}

export default function ShiftSwapRequestModal({
  coworkers,
  myWorkdays,
  targetWorkdays,
  loadingData,
  loadingTargetWorkdays,
  submitting,
  onLoadTargetWorkdays,
  onSubmit,
  onClose,
}: ShiftSwapRequestModalProps) {
  const t = useTranslations("dashboard.schedule.swaps");
  const tc = useTranslations("common");
  const titleId = useId();
  const coworkerId = useId();
  const noteId = useId();

  const [myWorkdayId, setMyWorkdayId] = useState("");
  const [targetWorkerId, setTargetWorkerId] = useState("");
  const [targetWorkdayId, setTargetWorkdayId] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleCoworkerChange = (workerId: string) => {
    setTargetWorkerId(workerId);
    setTargetWorkdayId("");
    if (workerId) onLoadTargetWorkdays(workerId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myWorkdayId || !targetWorkerId || !targetWorkdayId) return;
    const ok = await onSubmit({
      targetId: targetWorkerId,
      requesterWorkdayId: myWorkdayId,
      targetWorkdayId,
      requesterNote: note.trim() || undefined,
    });
    if (ok) onClose();
  };

  const isValid = Boolean(myWorkdayId && targetWorkerId && targetWorkdayId);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-card shadow-float"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            {t("request")}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={tc("cancel")}
            className="-mr-2 rounded-full"
          >
            <X />
          </Button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-5 overflow-y-auto px-6 py-5">
            {loadingData ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded-lg bg-track motion-reduce:animate-none"
                  />
                ))}
              </div>
            ) : (
              <>
                {/* My workday */}
                <WorkdayPicker
                  label={t("myDay")}
                  workdays={myWorkdays}
                  selectedId={myWorkdayId}
                  onSelect={setMyWorkdayId}
                  placeholder={t("selectDay")}
                  noWorkdaysText={t("noWorkdays")}
                />

                {/* Coworker */}
                <div className="space-y-2">
                  <Label htmlFor={coworkerId}>{t("selectWorker")}</Label>
                  <NativeSelect
                    id={coworkerId}
                    value={targetWorkerId}
                    onChange={(e) => handleCoworkerChange(e.target.value)}
                    required
                  >
                    <option value="">{t("selectWorker")}</option>
                    {coworkers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.job} — {w.dni}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                {/* Target workday */}
                {targetWorkerId &&
                  (loadingTargetWorkdays ? (
                    <div className="h-12 animate-pulse rounded-lg bg-track motion-reduce:animate-none" />
                  ) : (
                    <WorkdayPicker
                      label={t("selectTheirDay")}
                      workdays={targetWorkdays}
                      selectedId={targetWorkdayId}
                      onSelect={setTargetWorkdayId}
                      placeholder={t("selectTheirDay")}
                      noWorkdaysText={t("noWorkdays")}
                    />
                  ))}

                {/* Note */}
                <div className="space-y-2">
                  <Label htmlFor={noteId}>{t("requesterNote")}</Label>
                  <Textarea
                    id={noteId}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("requesterNotePlaceholder")}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              {tc("cancel")}
            </Button>
            <Button type="submit" disabled={!isValid || submitting}>
              <Send />
              {submitting ? t("submitting") : t("submitRequest")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
