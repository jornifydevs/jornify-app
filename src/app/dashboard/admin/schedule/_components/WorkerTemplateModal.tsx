"use client";

import { useState, useEffect, useId } from "react";
import { X, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
  const titleId = useId();

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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl border bg-card shadow-float"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {t("configureTemplate")}
            </h2>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
              {workerName}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label={t("cancel")}
            className="-mr-2 -mt-1 shrink-0"
          >
            <X />
          </Button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto px-4 py-4 sm:px-6">
            {orderedDays.map((day) => {
              const key = DAY_KEYS[day.dayOfWeek];
              return (
                <div
                  key={day.dayOfWeek}
                  className={cn(
                    "flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border p-3 transition-colors",
                    day.isWorkingDay
                      ? "bg-card"
                      : "border-transparent bg-secondary/60"
                  )}
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
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [@media(pointer:coarse)]:size-11",
                      day.isWorkingDay
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border-strong bg-card text-muted-foreground hover:text-foreground"
                    )}
                    aria-label={
                      day.isWorkingDay ? t("notWorkingDay") : t("workingDay")
                    }
                  >
                    {t(`days.${key}`)}
                  </button>

                  {/* Label */}
                  <span
                    className={cn(
                      "w-20 shrink-0 text-sm font-medium",
                      day.isWorkingDay
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {day.isWorkingDay ? t("workingDay") : t("notWorkingDay")}
                  </span>

                  {/* Time inputs */}
                  {day.isWorkingDay ? (
                    <div className="flex w-full items-center gap-2 sm:w-auto sm:flex-1">
                      <Input
                        type="time"
                        value={toInput(day.startWorkday)}
                        onChange={(e) =>
                          updateDay(
                            day.dayOfWeek,
                            "startWorkday",
                            toStorage(e.target.value)
                          )
                        }
                        aria-label={t("entry")}
                        className="h-10 min-w-0 flex-1 px-3 tabular-nums [@media(pointer:coarse)]:h-11"
                      />
                      <span
                        aria-hidden="true"
                        className="text-muted-foreground"
                      >
                        –
                      </span>
                      <Input
                        type="time"
                        value={toInput(day.endWorkday)}
                        onChange={(e) =>
                          updateDay(
                            day.dayOfWeek,
                            "endWorkday",
                            toStorage(e.target.value)
                          )
                        }
                        aria-label={t("exit")}
                        className="h-10 min-w-0 flex-1 px-3 tabular-nums [@media(pointer:coarse)]:h-11"
                      />
                    </div>
                  ) : (
                    <span className="flex-1 text-sm text-muted-foreground">
                      {t("noWorkday")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse gap-2 border-t px-4 py-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-6">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              <Save />
              {saving ? t("saving") : t("saveAndGenerate")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
