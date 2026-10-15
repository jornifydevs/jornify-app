"use client";

import { useState, useEffect } from "react";
import { X, ArrowLeftRight, Send } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
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
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <p className="text-sm text-slate-400 dark:text-slate-500 italic px-1">
          {noWorkdaysText}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="flex gap-2">
        {/* Month select */}
        <select
          value={activeMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="w-2/5 text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white capitalize"
        >
          {monthKeys.map((key) => (
            <option key={key} value={key}>
              {formatMonthKey(key, locale)}
            </option>
          ))}
        </select>

        {/* Day select */}
        <select
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
          required
          className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        >
          <option value="">{placeholder}</option>
          {daysInMonth.map((w) => (
            <option key={w.id} value={w.id}>
              {formatDay(w, locale)}
            </option>
          ))}
        </select>
      </div>
    </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-orange-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {t("request")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            aria-label={tc("cancel")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {loadingData ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"
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
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t("selectWorker")}
                  </label>
                  <select
                    value={targetWorkerId}
                    onChange={(e) => handleCoworkerChange(e.target.value)}
                    required
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">{t("selectWorker")}</option>
                    {coworkers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.job} — {w.dni}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target workday */}
                {targetWorkerId &&
                  (loadingTargetWorkdays ? (
                    <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
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
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {t("requesterNote")}
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("requesterNotePlaceholder")}
                    rows={2}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 resize-none"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-60 font-medium"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? t("submitting") : t("submitRequest")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
