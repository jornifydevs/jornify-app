"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { SupabaseWorkdayRepository } from "@/infrastructure/supabase/repositories/supabase-workday.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { GetWorkerScheduleUseCase } from "@/core/application/use-cases/shifts/get-worker-schedule.use-case";
import type { Workday } from "@/core/domain/entities";
import { useTranslations, useLocale } from "next-intl";

interface UseWorkerScheduleProps {
  workerId: string;
}

export function useWorkerSchedule({ workerId }: UseWorkerScheduleProps) {
  const [workdays, setWorkdays] = useState<Workday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

  const t = useTranslations("dashboard.schedule.errors");
  const locale = useLocale();

  const supabase = useMemo(() => createClient(), []);
  const workdayRepo = useMemo(
    () => new SupabaseWorkdayRepository(supabase),
    [supabase]
  );
  const workerRepo = useMemo(
    () => new SupabaseWorkerRepository(supabase),
    [supabase]
  );

  const getWeekDates = useCallback((offset: number) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday + offset * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const toLocal = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    return {
      startDate: toLocal(monday),
      endDate: toLocal(sunday),
      monday,
      sunday,
    };
  }, []);

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getWeekDates(weekOffset);
      const useCase = new GetWorkerScheduleUseCase(workdayRepo, workerRepo);
      const result = await useCase.execute(workerId, startDate, endDate);
      setWorkdays(result);
    } catch {
      setError(t("loadSchedule"));
    } finally {
      setLoading(false);
    }
  }, [workerId, weekOffset, workdayRepo, workerRepo, getWeekDates, t]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const { startDate, endDate, monday, sunday } = getWeekDates(weekOffset);
  const today = new Date().toISOString().split("T")[0];

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${mo}-${da}`;
    return {
      date: dateStr,
      label: d.toLocaleDateString(locale, {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
      isToday: dateStr === today,
      isWeekend: d.getDay() === 0 || d.getDay() === 6,
      workday: workdays.find((w) => w.day === dateStr) ?? null,
    };
  });

  const weekLabel = `${monday.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  })} – ${sunday.toLocaleDateString(locale, { day: "numeric", month: "short" })}`;

  return {
    weekDays,
    loading,
    error,
    weekOffset,
    weekLabel,
    startDate,
    endDate,
    goToPreviousWeek: () => setWeekOffset((o) => o - 1),
    goToNextWeek: () => setWeekOffset((o) => o + 1),
    goToCurrentWeek: () => setWeekOffset(0),
    reload: loadSchedule,
  };
}
