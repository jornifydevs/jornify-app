"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import UserMenu from "../../_components/UserMenu";
import { useCalendar } from "../_hooks/useCalendar";
import type { CenterFeature, PublicHoliday } from "@/core/domain/entities";
import type { CalendarDay } from "@/core/application/dtos/calendar.dto";
import { useTranslations, useLocale } from "next-intl";

interface CalendarViewProps {
  countryCode?: string;
  subdivisionCode?: string;
  centerId?: string;
  userEmail: string;
  enabledFeatures: CenterFeature[];
}

export default function CalendarView({
  countryCode,
  subdivisionCode,
  centerId,
  userEmail,
  enabledFeatures,
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

  const getHolidayDotColor = (holiday: PublicHoliday): string => {
    if (isHolidayLocal(holiday)) return "bg-orange-400";
    if (isHolidayGlobal(holiday)) return "bg-blue-400";
    return "bg-emerald-400";
  };

  const getHolidayTextColor = (holiday: PublicHoliday): string => {
    if (isHolidayLocal(holiday)) return "text-orange-300";
    if (isHolidayGlobal(holiday)) return "text-blue-300";
    return "text-emerald-300";
  };

  const getHolidayCardStyle = (holiday: PublicHoliday): string => {
    if (isHolidayLocal(holiday)) return "bg-orange-500/10 border-orange-500/30";
    if (isHolidayGlobal(holiday)) return "bg-blue-500/10 border-blue-500/30";
    return "bg-emerald-500/10 border-emerald-500/30";
  };

  const getDayClasses = (day: CalendarDay): string => {
    const base =
      "relative flex flex-col items-center justify-start p-1 sm:p-2 min-h-[44px] sm:min-h-[56px] rounded-lg transition-colors cursor-pointer";

    if (!day.isCurrentMonth) {
      return `${base} text-slate-300 dark:text-slate-600`;
    }

    if (day.isToday) {
      return `${base} ring-2 ring-slate-900/70 dark:ring-white/70 text-slate-900 dark:text-white font-bold`;
    }

    if (day.holidays.length > 0) {
      const hasLocal = day.holidays.some((h) => h.holidayType === "local");
      const hasNational = day.holidays.some((h) => h.global);
      if (hasLocal) {
        return `${base} bg-orange-500/20 text-orange-300`;
      }
      if (hasNational) {
        return `${base} bg-blue-500/20 text-blue-300`;
      }
      return `${base} bg-emerald-500/20 text-emerald-300`;
    }

    if (day.isWeekend) {
      return `${base} text-slate-500`;
    }

    return `${base} text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/30`;
  };

  const handleDayClick = (day: CalendarDay) => {
    if (day.holidays.length > 0) {
      setSelectedDay(selectedDay?.date === day.date ? null : day);
    } else {
      setSelectedDay(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center justify-center w-10 h-10 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t("title")}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>
          <UserMenu enabledFeatures={enabledFeatures} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - All Year Holidays */}
          <div className="w-full lg:w-80 lg:flex-shrink-0 order-2 lg:order-1">
            <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 lg:sticky lg:top-6">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
                  {t("holidays", { year })}
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  {allYearHolidays.length} festivos
                </p>

                {loading ? (
                  <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{t("loading")}</span>
                  </div>
                ) : allYearHolidays.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">
                    {t("noHolidays")}
                  </p>
                ) : (
                  <div className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                    {allYearHolidays.map((holiday) => {
                      const isPast =
                        new Date(holiday.date + "T00:00:00") <
                        new Date(new Date().toDateString());
                      return (
                        <div
                          key={`${holiday.date}-${holiday.localName}`}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700/30 ${
                            isPast ? "opacity-50" : ""
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getHolidayDotColor(holiday)}`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-700 dark:text-slate-200 leading-tight">
                              {holiday.localName}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
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
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <span className="text-xs text-slate-500">
                      {t("national")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs text-slate-500">
                      {t("regional")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                    <span className="text-xs text-slate-500">{t("local")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Calendar */}
          <div className="flex-1 space-y-6 order-1 lg:order-2">
            {/* Month Navigation */}
            <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
              <CardContent className="pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToPreviousMonth}
                    className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
                      {monthLabel}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToToday}
                      className="text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700"
                    >
                      {t("today")}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={goToNextMonth}
                    className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Calendar Grid */}
            <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
              <CardContent className="pt-4 sm:pt-6">
                {loading ? (
                  <div className="flex items-center justify-center p-12 text-slate-400 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t("loadingCalendar")}
                  </div>
                ) : (
                  <>
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {weekdayNames.map((name) => (
                        <div
                          key={name}
                          className="text-center text-xs font-medium text-slate-500 py-2"
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
                          onClick={() => handleDayClick(day)}
                          className={getDayClasses(day)}
                        >
                          <span className="text-sm sm:text-base">
                            {day.dayOfMonth}
                          </span>
                          {day.isCurrentMonth && day.holidays.length > 0 && (
                            <span className="flex gap-0.5 mt-0.5">
                              {day.holidays.some((h) => h.global) && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                              )}
                              {day.holidays.some(
                                (h) => !h.global && h.holidayType !== "local"
                              ) && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              )}
                              {day.holidays.some(
                                (h) => h.holidayType === "local"
                              ) && (
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                              )}
                            </span>
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
              <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                    {new Date(
                      selectedDay.date + "T00:00:00"
                    ).toLocaleDateString(locale, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <div className="space-y-2">
                    {selectedDay.holidays.map((holiday) => (
                      <div
                        key={`${holiday.date}-${holiday.localName}`}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${getHolidayCardStyle(holiday)}`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getHolidayDotColor(holiday)}`}
                        />
                        <div>
                          <p
                            className={`text-sm font-medium ${getHolidayTextColor(holiday)}`}
                          >
                            {holiday.localName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {getHolidayLabel(holiday)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
