"use client";

import { useState, useEffect, useCallback } from "react";
import { NagerHolidayService } from "@/infrastructure/nager/nager-holiday.service";
import { GetPublicHolidaysUseCase } from "@/core/application/use-cases/calendar/get-public-holidays.use-case";
import { createClient } from "@/infrastructure/supabase/client";
import { SupabaseLocalHolidayRepository } from "@/infrastructure/supabase/repositories/supabase-local-holiday.repository";
import type { CalendarDay } from "@/core/application/dtos/calendar.dto";
import type { PublicHoliday } from "@/core/domain/entities";

interface UseCalendarProps {
  countryCode?: string;
  subdivisionCode?: string;
  centerId?: string;
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEKDAY_NAMES = ["L", "M", "X", "J", "V", "S", "D"];

export function useCalendar({
  countryCode = "ES",
  subdivisionCode,
  centerId,
}: UseCalendarProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [allYearHolidays, setAllYearHolidays] = useState<PublicHoliday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const holidayService = new NagerHolidayService();

  const loadCalendar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allHolidays = await holidayService.getPublicHolidays(
        year,
        countryCode
      );
      const filtered = allHolidays.filter((h) => {
        if (h.global) return true;
        if (!subdivisionCode) return false;
        return h.counties !== null && h.counties.includes(subdivisionCode);
      });

      // Load local holidays from database
      let localAsPublic: PublicHoliday[] = [];
      if (centerId) {
        const supabase = createClient();
        const localHolidayRepo = new SupabaseLocalHolidayRepository(supabase);
        const localHolidays = await localHolidayRepo.findByCenterIdAndYear(
          centerId,
          year
        );
        localAsPublic = localHolidays.map((lh) => ({
          date: lh.date,
          localName: lh.name,
          name: lh.name,
          countryCode,
          global: false,
          counties: null,
          types: ["Local"],
          holidayType: "local" as const,
        }));
      }

      const allCombined = [...filtered, ...localAsPublic].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      setAllYearHolidays(allCombined);

      const useCase = new GetPublicHolidaysUseCase(holidayService);
      const result = await useCase.execute({
        year,
        month,
        countryCode,
        subdivisionCode,
      });

      // Merge local holidays into calendar days
      const daysWithLocal = result.map((day) => {
        const localForDay = localAsPublic.filter((lh) => lh.date === day.date);
        if (localForDay.length > 0) {
          return { ...day, holidays: [...day.holidays, ...localForDay] };
        }
        return day;
      });

      setDays(daysWithLocal);
    } catch {
      setError("Error al cargar el calendario");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, countryCode, subdivisionCode, centerId]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const goToPreviousMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
    setSelectedDay(null);
  };

  const goToToday = () => {
    const today = new Date();
    setYear(today.getFullYear());
    setMonth(today.getMonth());
    setSelectedDay(null);
  };

  const monthLabel = `${MONTH_NAMES[month]} ${year}`;

  const holidaysInMonth: PublicHoliday[] = days
    .filter((d) => d.isCurrentMonth && d.holidays.length > 0)
    .flatMap((d) => d.holidays);

  const isHolidayGlobal = (holiday: PublicHoliday): boolean => holiday.global;
  const isHolidayLocal = (holiday: PublicHoliday): boolean =>
    holiday.holidayType === "local";

  return {
    days,
    loading,
    error,
    year,
    month,
    monthLabel,
    weekdayNames: WEEKDAY_NAMES,
    selectedDay,
    setSelectedDay,
    holidaysInMonth,
    allYearHolidays,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    isHolidayGlobal,
    isHolidayLocal,
  };
}
