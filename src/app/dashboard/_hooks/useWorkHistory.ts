"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { SupabaseWorkdayRepository } from "@/infrastructure/supabase/repositories/supabase-workday.repository";
import { SupabaseTimeRecordRepository } from "@/infrastructure/supabase/repositories/supabase-time-record.repository";
import { GetWorkHistoryUseCase } from "@/core/application/use-cases/time-tracking/get-work-history.use-case";
import type {
  HistoryFilter,
  TimeRecordWithWorkday,
} from "@/core/application/dtos/work-history.dto";
import { useTranslations, useLocale } from "next-intl";

interface UseWorkHistoryProps {
  workerId: string;
}

export function useWorkHistory({ workerId }: UseWorkHistoryProps) {
  const [records, setRecords] = useState<TimeRecordWithWorkday[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<HistoryFilter>("week");
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations("dashboard.history.errors");
  const locale = useLocale();

  const supabase = useMemo(() => createClient(), []);
  const workdayRepo = useMemo(
    () => new SupabaseWorkdayRepository(supabase),
    [supabase]
  );
  const timeRecordRepo = useMemo(
    () => new SupabaseTimeRecordRepository(supabase),
    [supabase]
  );

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const useCase = new GetWorkHistoryUseCase(workdayRepo, timeRecordRepo);
      const result = await useCase.execute(workerId, filter, offset);
      setRecords(result);
    } catch {
      setError(t("loadHistory"));
    } finally {
      setLoading(false);
    }
  }, [workerId, filter, offset, workdayRepo, timeRecordRepo]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleFilterChange = (newFilter: HistoryFilter) => {
    setFilter(newFilter);
    setOffset(0);
  };

  const goToPrevious = () => {
    setOffset((prev) => prev + 1);
  };

  const goToNext = () => {
    setOffset((prev) => Math.max(0, prev - 1));
  };

  const canGoNext = offset > 0;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const calculateTotalHours = () => {
    let totalSeconds = 0;
    records.forEach((record) => {
      if (record.totalHour) {
        const [hours, minutes, seconds] = record.totalHour
          .split(":")
          .map(Number);
        totalSeconds += hours * 3600 + minutes * 60 + seconds;
      }
    });
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getPeriodDates = (): { start: string; end: string } => {
    const now = new Date();

    switch (filter) {
      case "today": {
        const day = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - offset
        );
        return { start: formatDateLocal(day), end: formatDateLocal(day) };
      }
      case "week": {
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const currentMonday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - daysToMonday
        );
        const targetMonday = new Date(currentMonday);
        targetMonday.setDate(targetMonday.getDate() - offset * 7);
        const targetSunday = new Date(targetMonday);
        targetSunday.setDate(targetSunday.getDate() + 6);
        return {
          start: formatDateLocal(targetMonday),
          end: formatDateLocal(targetSunday),
        };
      }
      case "month": {
        const targetMonth = now.getMonth() - offset;
        const startDate = new Date(now.getFullYear(), targetMonth, 1);
        const endDate = new Date(now.getFullYear(), targetMonth + 1, 0);
        return {
          start: formatDateLocal(startDate),
          end: formatDateLocal(endDate),
        };
      }
    }
  };

  const getPeriodLabel = (): string => {
    const now = new Date();

    switch (filter) {
      case "today": {
        const day = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - offset
        );
        return day.toLocaleDateString(locale, {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
      }
      case "week": {
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const currentMonday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - daysToMonday
        );
        const targetMonday = new Date(currentMonday);
        targetMonday.setDate(targetMonday.getDate() - offset * 7);
        const targetSunday = new Date(targetMonday);
        targetSunday.setDate(targetSunday.getDate() + 6);

        const formatShort = (d: Date) =>
          d.toLocaleDateString(locale, { day: "numeric", month: "short" });
        return `${formatShort(targetMonday)} - ${formatShort(targetSunday)}`;
      }
      case "month": {
        const targetDate = new Date(
          now.getFullYear(),
          now.getMonth() - offset,
          1
        );
        return targetDate.toLocaleDateString(locale, {
          month: "long",
          year: "numeric",
        });
      }
    }
  };

  return {
    records,
    loading,
    filter,
    offset,
    error,
    setFilter: handleFilterChange,
    goToPrevious,
    goToNext,
    canGoNext,
    getPeriodLabel,
    getPeriodDates,
    formatTime,
    formatDate,
    calculateTotalHours,
  };
}
