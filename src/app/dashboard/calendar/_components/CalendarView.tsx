"use client";

import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { useCalendar } from "../_hooks/useCalendar";
import type { PublicHoliday } from "@/core/domain/entities";
import type { CalendarDay } from "@/core/application/dtos/calendar.dto";
import { useTranslations, useLocale } from "next-intl";

interface CalendarViewProps {
  countryCode?: string;
  subdivisionCode?: string;
  centerId?: string;
}

// Every public holiday uses the brand tone; the dot fill tells the scopes apart.
const HOLIDAY_DOT = {
  national: "bg-brand",
  regional: "bg-brand/50",
  local: "border-[1.5px] border-brand",
} as const;

type HolidayScope = keyof typeof HOLIDAY_DOT;

export default function CalendarView({
  countryCode,
  subdivisionCode,
  centerId,
}: CalendarViewProps) {
  const {
    days,
    loading,
    error,
    year,
    monthLabel,
    weekdayNames,
    selectedDay,
    setSelectedDay,
    allYearHolidays,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    isHolidayGlobal,
    isHolidayLocal,
  } = useCalendar({ countryCode, subdivisionCode, centerId });

  const t = useTranslations("dashboard.calendar");
  const locale = useLocale();

  const getHolidayLabel = (holiday: PublicHoliday): string => {
    if (isHolidayLocal(holiday)) return t("local");
    if (isHolidayGlobal(holiday)) return t("national");
    return t("regional");
  };

  const getHolidayScope = (holiday: PublicHoliday): HolidayScope => {
    if (isHolidayLocal(holiday)) return "local";
    if (isHolidayGlobal(holiday)) return "national";
    return "regional";
  };

  const getDayClasses = (day: CalendarDay): string => {
    const isHoliday = day.isCurrentMonth && day.holidays.length > 0;

    return cn(
      "relative flex min-h-11 flex-col items-center justify-start rounded-lg p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-14 sm:p-2",
      !day.isCurrentMonth
        ? "text-muted-foreground/50 hover:bg-accent"
        : isHoliday
          ? "bg-brand-soft font-semibold text-brand-text hover:bg-brand/20"
          : day.isWeekend
            ? "bg-secondary/60 text-muted-foreground hover:bg-accent"
            : "text-foreground hover:bg-accent",
      day.isCurrentMonth &&
        day.isToday &&
        "font-semibold ring-2 ring-inset ring-foreground",
      isHoliday &&
        selectedDay?.date === day.date &&
        "ring-2 ring-inset ring-brand"
    );
  };

  const handleDayClick = (day: CalendarDay) => {
    if (day.holidays.length > 0) {
      setSelectedDay(selectedDay?.date === day.date ? null : day);
    } else {
      setSelectedDay(null);
    }
  };

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-6 lg:pt-8">
        <PageHeader title={t("title")} />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - All Year Holidays */}
          <div className="w-full lg:w-80 lg:flex-shrink-0 order-2 lg:order-1">
            <Card className="lg:sticky lg:top-6">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-base font-semibold tracking-tight">
                  {t("holidays", { year })}
                </h2>
                <p className="mb-4 mt-0.5 text-sm text-muted-foreground">
                  {t("holidayCount", { count: allYearHolidays.length })}
                </p>

                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    {t("loading")}
                  </div>
                ) : allYearHolidays.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t("noHolidays")}
                  </p>
                ) : (
                  <ul className="-mx-2 max-h-[calc(100vh-200px)] space-y-0.5 overflow-y-auto">
                    {allYearHolidays.map((holiday) => {
                      const isPast =
                        new Date(holiday.date + "T00:00:00") <
                        new Date(new Date().toDateString());
                      return (
                        <li
                          key={`${holiday.date}-${holiday.localName}`}
                          className="flex items-start gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-accent"
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              "mt-1.5 size-2 shrink-0 rounded-full",
                              HOLIDAY_DOT[getHolidayScope(holiday)]
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-sm leading-tight",
                                isPast
                                  ? "text-muted-foreground"
                                  : "font-medium text-foreground"
                              )}
                            >
                              {holiday.localName}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground first-letter:uppercase">
                              {new Date(
                                holiday.date + "T00:00:00"
                              ).toLocaleDateString(locale, {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                              {" · "}
                              {getHolidayLabel(holiday)}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Legend */}
                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
                  <li className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-2.5 rounded-full",
                        HOLIDAY_DOT.national
                      )}
                    />
                    {t("national")}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-2.5 rounded-full",
                        HOLIDAY_DOT.regional
                      )}
                    />
                    {t("regional")}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className={cn("size-2.5 rounded-full", HOLIDAY_DOT.local)}
                    />
                    {t("local")}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Calendar */}
          <div className="flex-1 space-y-6 order-1 lg:order-2">
            {/* Month Navigation */}
            <Card>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="shrink-0 rounded-full"
                    onClick={goToPreviousMonth}
                    aria-label={t("previousMonth")}
                  >
                    <ChevronLeft />
                  </Button>
                  <div className="flex min-w-0 flex-col items-center gap-1 sm:flex-row sm:gap-3">
                    <h2 className="text-center text-lg font-semibold tracking-tight sm:text-xl">
                      {monthLabel}
                    </h2>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={goToToday}
                    >
                      {t("today")}
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="shrink-0 rounded-full"
                    onClick={goToNextMonth}
                    aria-label={t("nextMonth")}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Error */}
            {error && <Alert variant="error">{error}</Alert>}

            {/* Calendar Grid */}
            <Card>
              <CardContent className="p-3 sm:p-6">
                {loading ? (
                  <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
                    <Loader2
                      className="size-5 animate-spin"
                      aria-hidden="true"
                    />
                    {t("loadingCalendar")}
                  </div>
                ) : (
                  <>
                    {/* Weekday Headers */}
                    <div className="mb-1 grid grid-cols-7 gap-1">
                      {weekdayNames.map((name) => (
                        <div
                          key={name}
                          className="py-2 text-center text-xs font-medium text-muted-foreground"
                        >
                          {name}
                        </div>
                      ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {days.map((day) => (
                        <button
                          key={day.date}
                          type="button"
                          onClick={() => handleDayClick(day)}
                          aria-current={
                            day.isCurrentMonth && day.isToday
                              ? "date"
                              : undefined
                          }
                          aria-pressed={
                            day.isCurrentMonth && day.holidays.length > 0
                              ? selectedDay?.date === day.date
                              : undefined
                          }
                          className={getDayClasses(day)}
                        >
                          <span className="text-sm tabular-nums sm:text-base">
                            {day.dayOfMonth}
                          </span>
                          {day.isCurrentMonth && day.holidays.length > 0 && (
                            <>
                              <span className="sr-only">
                                {day.holidays
                                  .map((h) => h.localName)
                                  .join(", ")}
                              </span>
                              <span
                                aria-hidden="true"
                                className="mt-0.5 flex gap-0.5"
                              >
                                {day.holidays.some((h) => h.global) && (
                                  <span
                                    className={cn(
                                      "size-1.5 rounded-full",
                                      HOLIDAY_DOT.national
                                    )}
                                  />
                                )}
                                {day.holidays.some(
                                  (h) => !h.global && h.holidayType !== "local"
                                ) && (
                                  <span
                                    className={cn(
                                      "size-1.5 rounded-full",
                                      HOLIDAY_DOT.regional
                                    )}
                                  />
                                )}
                                {day.holidays.some(
                                  (h) => h.holidayType === "local"
                                ) && (
                                  <span
                                    className={cn(
                                      "size-1.5 rounded-full",
                                      HOLIDAY_DOT.local
                                    )}
                                  />
                                )}
                              </span>
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Selected Day Detail */}
            {selectedDay && selectedDay.holidays.length > 0 && (
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <p className="mb-3 text-sm text-muted-foreground first-letter:uppercase">
                    {new Date(
                      selectedDay.date + "T00:00:00"
                    ).toLocaleDateString(locale, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <ul className="space-y-2">
                    {selectedDay.holidays.map((holiday) => (
                      <li
                        key={`${holiday.date}-${holiday.localName}`}
                        className="flex items-center gap-3 rounded-lg bg-brand-soft p-3"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "size-2.5 shrink-0 rounded-full",
                            HOLIDAY_DOT[getHolidayScope(holiday)]
                          )}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {holiday.localName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getHolidayLabel(holiday)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
