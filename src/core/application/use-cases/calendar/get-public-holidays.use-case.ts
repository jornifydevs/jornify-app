import type { HolidayService } from "@/core/domain/ports/services/holiday.service";
import type {
  GetCalendarInput,
  CalendarDay,
} from "@/core/application/dtos/calendar.dto";

export class GetPublicHolidaysUseCase {
  constructor(private holidayService: HolidayService) {}

  async execute(input: GetCalendarInput): Promise<CalendarDay[]> {
    const { year, month, countryCode = "ES", subdivisionCode } = input;

    const allHolidays = await this.holidayService.getPublicHolidays(
      year,
      countryCode
    );

    const filtered = allHolidays.filter((h) => {
      if (h.global) return true;
      if (!subdivisionCode) return false;
      return h.counties !== null && h.counties.includes(subdivisionCode);
    });

    return this.buildCalendarGrid(year, month, filtered);
  }

  private buildCalendarGrid(
    year: number,
    month: number,
    holidays: import("@/core/domain/entities").PublicHoliday[]
  ): CalendarDay[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday = 0, Sunday = 6 (ISO weeks)
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const today = new Date();
    const todayStr = this.formatDate(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    const days: CalendarDay[] = [];

    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = this.formatDate(prevYear, prevMonth, d);
      const dow = this.getDayOfWeek(prevYear, prevMonth, d);
      days.push({
        date: dateStr,
        dayOfMonth: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend: dow >= 5,
        holidays: this.getHolidaysForDate(dateStr, holidays),
      });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = this.formatDate(year, month, d);
      const dow = this.getDayOfWeek(year, month, d);
      days.push({
        date: dateStr,
        dayOfMonth: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWeekend: dow >= 5,
        holidays: this.getHolidaysForDate(dateStr, holidays),
      });
    }

    // Next month padding (fill to complete last week row)
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      for (let d = 1; d <= remaining; d++) {
        const dateStr = this.formatDate(nextYear, nextMonth, d);
        const dow = this.getDayOfWeek(nextYear, nextMonth, d);
        days.push({
          date: dateStr,
          dayOfMonth: d,
          isCurrentMonth: false,
          isToday: dateStr === todayStr,
          isWeekend: dow >= 5,
          holidays: this.getHolidaysForDate(dateStr, holidays),
        });
      }
    }

    return days;
  }

  private formatDate(year: number, month: number, day: number): string {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  }

  private getDayOfWeek(year: number, month: number, day: number): number {
    // 0 = Monday, 6 = Sunday (ISO)
    const dow = new Date(year, month, day).getDay();
    return dow === 0 ? 6 : dow - 1;
  }

  private getHolidaysForDate(
    date: string,
    holidays: import("@/core/domain/entities").PublicHoliday[]
  ): import("@/core/domain/entities").PublicHoliday[] {
    return holidays.filter((h) => h.date === date);
  }
}
