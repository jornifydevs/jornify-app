"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Plus, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import UserMenu from "../../_components/UserMenu";
import { useAvailability } from "../_hooks/useAvailability";
import type { CenterFeature } from "@/core/domain/entities";
import { useTranslations } from "next-intl";

interface AvailabilityViewProps {
  workerId: string;
  centerId: string;
  userEmail: string;
  enabledFeatures: CenterFeature[];
  allowedDayTypes: string[];
}

export default function AvailabilityView({
  workerId,
  centerId,
  userEmail,
  enabledFeatures,
  allowedDayTypes,
}: AvailabilityViewProps) {
  const {
    records,
    loading,
    error,
    typeFilter,
    setTypeFilter,
    yearFilter,
    setYearFilter,
    availableTypes,
    showRequestForm,
    setShowRequestForm,
    isRequesting,
    requestError,
    requestSuccess,
    setRequestSuccess,
    requestDayOff,
    formatDate,
    getDayTypeLabel,
    getDayTypeColor,
  } = useAvailability({ workerId, centerId });

  const t = useTranslations("dashboard.availability");
  const tc = useTranslations("common");

  const [requestStartDay, setRequestStartDay] = useState("");
  const [requestEndDay, setRequestEndDay] = useState("");
  const [requestType, setRequestType] = useState("");

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (requestStartDay && requestEndDay && requestType) {
      requestDayOff(requestStartDay, requestEndDay, requestType);
    }
  };

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

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
              <div className="p-2 bg-emerald-600 rounded-lg">
                <CalendarDays className="w-6 h-6 text-white" />
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
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Title + Request button */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900 dark:text-white">
            {t("myDaysOff")}
          </h2>
          <Button
            onClick={() => {
              setShowRequestForm(!showRequestForm);
              setRequestSuccess(false);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {showRequestForm ? (
              <>
                <X className="w-4 h-4 mr-1" />
                {t("cancel")}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                {t("requestDayOff")}
              </>
            )}
          </Button>
        </div>

        {/* Success message */}
        {requestSuccess && !showRequestForm && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
            <Check className="w-4 h-4" />
            {t("requestSuccess")}
          </div>
        )}

        {/* Request Form */}
        {showRequestForm && (
          <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base">
                <Plus className="w-5 h-5" />
                {t("requestFormTitle")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="requestStartDay"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      {t("startDate")}
                    </Label>
                    <Input
                      id="requestStartDay"
                      type="date"
                      value={requestStartDay}
                      onChange={(e) => {
                        setRequestStartDay(e.target.value);
                        if (!requestEndDay || e.target.value > requestEndDay) {
                          setRequestEndDay(e.target.value);
                        }
                      }}
                      min={new Date().toISOString().split("T")[0]}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="requestEndDay"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      {t("endDate")}
                    </Label>
                    <Input
                      id="requestEndDay"
                      type="date"
                      value={requestEndDay}
                      onChange={(e) => setRequestEndDay(e.target.value)}
                      min={
                        requestStartDay ||
                        new Date().toISOString().split("T")[0]
                      }
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="requestType"
                      className="text-slate-700 dark:text-slate-300"
                    >
                      {t("type")}
                    </Label>
                    <select
                      id="requestType"
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                      className="w-full h-10 px-3 rounded-md bg-white border border-slate-300 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    >
                      <option value="">{t("selectType")}</option>
                      {allowedDayTypes.map((type) => (
                        <option key={type} value={type}>
                          {getDayTypeLabel(type)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {requestError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {requestError}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    isRequesting ||
                    !requestStartDay ||
                    !requestEndDay ||
                    !requestType
                  }
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isRequesting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                      {t("requesting")}
                    </>
                  ) : (
                    t("confirmRequest")
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <select
                  value={typeFilter ?? ""}
                  onChange={(e) => setTypeFilter(e.target.value || null)}
                  className="w-full h-10 px-3 rounded-md bg-white border border-slate-300 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{t("allTypes")}</option>
                  {availableTypes.map((type) => (
                    <option key={type} value={type}>
                      {getDayTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>
              <select
                value={yearFilter ?? "all"}
                onChange={(e) =>
                  setYearFilter(
                    e.target.value === "all"
                      ? undefined
                      : Number(e.target.value)
                  )
                }
                className="h-10 px-3 rounded-md bg-white border border-slate-300 text-slate-900 dark:bg-slate-700 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">{t("allYears")}</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Records list */}
        <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center p-8 text-slate-400 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {tc("loading")}
              </div>
            ) : records.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t("noRecords")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 dark:bg-slate-900/50 dark:border-slate-700 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarDays className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-900 dark:text-white font-medium">
                        {formatDate(record.day)}
                      </span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getDayTypeColor(record.typeDay)}`}
                    >
                      {getDayTypeLabel(record.typeDay)}
                    </span>
                  </div>
                ))}
                <p className="text-sm text-slate-500 mt-4">
                  {records.length !== 1
                    ? t("showingPlural", { count: records.length })
                    : t("showing", { count: records.length })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
