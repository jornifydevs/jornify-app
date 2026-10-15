"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import type {
  WorkerScheduleTemplate,
  WorkerScheduleTemplateDay,
} from "@/core/domain/entities";

interface WorkerTemplateModalProps {
  workerId: string;
  workerName: string;
  existingTemplate: WorkerScheduleTemplate | null;
  defaultStart: string; // "09:00:00"
  defaultEnd: string; // "18:00:00"
  saving: boolean;
  onSave: (
    workerId: string,
    days: WorkerScheduleTemplateDay[]
  ) => Promise<boolean>;
  onClose: () => void;
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function toInput(time: string): string {
  return time.slice(0, 5);
}

function toStorage(time: string): string {
  return time.length === 5 ? time + ":00" : time;
}

export default function WorkerTemplateModal({
  workerId,
  workerName,
  existingTemplate,
  defaultStart,
  defaultEnd,
  saving,
  onSave,
  onClose,
}: WorkerTemplateModalProps) {
  const t = useTranslations("dashboard.admin.schedule");

  const [days, setDays] = useState<WorkerScheduleTemplateDay[]>(() => {
    if (existingTemplate && existingTemplate.days.length === 7) {
      return existingTemplate.days;
    }
    // Default: Mon-Fri working, Sat-Sun off
    return [0, 1, 2, 3, 4, 5, 6].map((dow) => ({
      dayOfWeek: dow,
      isWorkingDay: dow >= 1 && dow <= 5,
      startWorkday: defaultStart,
      endWorkday: defaultEnd,
    }));
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const updateDay = (
    dow: number,
    field: keyof WorkerScheduleTemplateDay,
    value: string | boolean
  ) => {
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dow ? { ...d, [field]: value } : d))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onSave(workerId, days);
    if (ok) onClose();
  };

  const orderedDays = [1, 2, 3, 4, 5, 6, 0].map(
    (dow) => days.find((d) => d.dayOfWeek === dow)!
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              {t("configureTemplate")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {workerName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            aria-label={t("cancel")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-2 max-h-[60vh] overflow-y-auto">
            {orderedDays.map((day) => {
              const key = DAY_KEYS[day.dayOfWeek];
              return (
                <div
                  key={day.dayOfWeek}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    day.isWorkingDay
                      ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50"
                      : "bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      updateDay(
                        day.dayOfWeek,
                        "isWorkingDay",
                        !day.isWorkingDay
                      )
                    }
                    className={`w-8 h-8 flex-shrink-0 rounded-lg text-xs font-bold transition-colors ${
                      day.isWorkingDay
                        ? "bg-orange-500 text-white"
                        : "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
                    }`}
                    aria-label={
                      day.isWorkingDay ? t("notWorkingDay") : t("workingDay")
                    }
                  >
                    {t(`days.${key}`)}
                  </button>

                  {/* Label */}
                  <span
                    className={`text-xs w-16 font-medium ${
                      day.isWorkingDay
                        ? "text-slate-700 dark:text-slate-200"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {day.isWorkingDay ? t("workingDay") : t("notWorkingDay")}
                  </span>

                  {/* Time inputs */}
                  {day.isWorkingDay ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time"
                        value={toInput(day.startWorkday)}
                        onChange={(e) =>
                          updateDay(
                            day.dayOfWeek,
                            "startWorkday",
                            toStorage(e.target.value)
                          )
                        }
                        className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                      <span className="text-xs text-slate-400">–</span>
                      <input
                        type="time"
                        value={toInput(day.endWorkday)}
                        onChange={(e) =>
                          updateDay(
                            day.dayOfWeek,
                            "endWorkday",
                            toStorage(e.target.value)
                          )
                        }
                        className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  ) : (
                    <span className="flex-1 text-xs text-slate-400 dark:text-slate-500 italic">
                      {t("noWorkday")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors disabled:opacity-60 font-medium"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? t("saving") : t("saveAndGenerate")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
