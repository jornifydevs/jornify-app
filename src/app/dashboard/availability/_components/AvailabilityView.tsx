"use client";

import { useState, type ComponentProps } from "react";
import { CalendarDays, Plus, Loader2, Check, X } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { useAvailability } from "../_hooks/useAvailability";
import { useTranslations } from "next-intl";

interface AvailabilityViewProps {
  workerId: string;
  centerId: string;
  allowedDayTypes: string[];
}

type StatusTone = ComponentProps<typeof StatusBadge>["tone"];

// Categorical day types: holiday → brand, time off → pause, sick leave → alert.
const DAY_TYPE_TONES: Record<string, StatusTone> = {
  holiday: "brand",
  vacation: "pause",
  sick_leave: "alert",
};

export default function AvailabilityView({
  workerId,
  centerId,
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
    <div>
      <div className="mx-auto max-w-4xl px-6 pt-6 lg:pt-8">
        <PageHeader title={t("title")} />
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Title + Request button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("myDaysOff")}
          </h2>
          <Button
            variant={showRequestForm ? "outline" : "default"}
            onClick={() => {
              setShowRequestForm(!showRequestForm);
              setRequestSuccess(false);
            }}
            aria-expanded={showRequestForm}
            className="w-full sm:w-auto"
          >
            {showRequestForm ? (
              <>
                <X />
                {t("cancel")}
              </>
            ) : (
              <>
                <Plus />
                {t("requestDayOff")}
              </>
            )}
          </Button>
        </div>

        {/* Success message */}
        {requestSuccess && !showRequestForm && (
          <Alert variant="success">
            <Check />
            {t("requestSuccess")}
          </Alert>
        )}

        {/* Request Form */}
        {showRequestForm && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold tracking-tight">
                {t("requestFormTitle")}
              </h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitRequest} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="requestStartDay">{t("startDate")}</Label>
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
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requestEndDay">{t("endDate")}</Label>
                    <Input
                      id="requestEndDay"
                      type="date"
                      value={requestEndDay}
                      onChange={(e) => setRequestEndDay(e.target.value)}
                      min={
                        requestStartDay ||
                        new Date().toISOString().split("T")[0]
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requestType">{t("type")}</Label>
                    <NativeSelect
                      id="requestType"
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                      required
                    >
                      <option value="">{t("selectType")}</option>
                      {allowedDayTypes.map((type) => (
                        <option key={type} value={type}>
                          {getDayTypeLabel(type)}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                </div>

                {requestError && <Alert variant="error">{requestError}</Alert>}

                <Button
                  type="submit"
                  disabled={
                    isRequesting ||
                    !requestStartDay ||
                    !requestEndDay ||
                    !requestType
                  }
                  className="w-full sm:w-auto"
                >
                  {isRequesting ? (
                    <>
                      <Loader2 className="animate-spin" />
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
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row">
              <NativeSelect
                aria-label={t("type")}
                value={typeFilter ?? ""}
                onChange={(e) => setTypeFilter(e.target.value || null)}
                className="sm:flex-1"
              >
                <option value="">{t("allTypes")}</option>
                {availableTypes.map((type) => (
                  <option key={type} value={type}>
                    {getDayTypeLabel(type)}
                  </option>
                ))}
              </NativeSelect>
              <NativeSelect
                aria-label={t("year")}
                value={yearFilter ?? "all"}
                onChange={(e) =>
                  setYearFilter(
                    e.target.value === "all"
                      ? undefined
                      : Number(e.target.value)
                  )
                }
                className="sm:w-44"
              >
                <option value="all">{t("allYears")}</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </CardContent>
        </Card>

        {/* Error display */}
        {error && <Alert variant="error">{error}</Alert>}

        {/* Records list */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              {tc("loading")}
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
              <CalendarDays
                className="size-10 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="font-medium">{t("noRecords")}</p>
            </div>
          ) : (
            <>
              <ul className="divide-y">
                {records.map((record) => (
                  <li
                    key={record.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent sm:px-6"
                  >
                    <CalendarDays
                      className="size-5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 text-sm font-medium tabular-nums first-letter:uppercase">
                      {formatDate(record.day)}
                    </span>
                    <StatusBadge
                      tone={DAY_TYPE_TONES[record.typeDay] ?? "neutral"}
                      size="sm"
                    >
                      {getDayTypeLabel(record.typeDay)}
                    </StatusBadge>
                  </li>
                ))}
              </ul>
              <p className="border-t px-4 py-3 text-sm text-muted-foreground sm:px-6">
                {records.length !== 1
                  ? t("showingPlural", { count: records.length })
                  : t("showing", { count: records.length })}
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
