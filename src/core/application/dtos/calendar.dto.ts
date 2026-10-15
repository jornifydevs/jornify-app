import type { PublicHoliday } from "@/core/domain/entities";

export interface GetCalendarInput {
  year: number;
  month: number;
  countryCode?: string;
  subdivisionCode?: string;
}

export interface CalendarDay {
  date: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  holidays: PublicHoliday[];
}
