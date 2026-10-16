"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  Coffee,
  Save,
  CalendarDays,
  Plus,
  Trash2,
  Loader2,
  Pencil,
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { createClient } from "@/infrastructure/supabase/client";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { SupabaseLocalHolidayRepository } from "@/infrastructure/supabase/repositories/supabase-local-holiday.repository";
import { UpdateCenterScheduleUseCase } from "@/core/application/use-cases/admin/update-center-schedule.use-case";
import {
  GetLocalHolidaysUseCase,
  CreateLocalHolidayUseCase,
  DeleteLocalHolidayUseCase,
} from "@/core/application/use-cases/admin/manage-local-holidays.use-case";
import { DomainError } from "@/core/domain/errors/domain-errors";
import { CENTER_FEATURES } from "@/core/domain/entities/center-feature";
import type { Center, LocalHoliday } from "@/core/domain/entities";
import { useTranslations, useLocale } from "next-intl";

interface Subdivision {
  code: string;
  name: string;
}

interface CountryOption {
  isoCode: string;
  name: string;
}

interface CenterScheduleFormProps {
  center: Center;
  userRole: string;
  subdivisions: Subdivision[];
  countryOptions: CountryOption[];
}

export default function CenterScheduleForm({
  center,
  userRole,
  subdivisions,
  countryOptions,
}: CenterScheduleFormProps) {
  const [formData, setFormData] = useState({
    defaultStartWorkday: center.defaultStartWorkday.slice(0, 5),
    defaultEndWorkday: center.defaultEndWorkday.slice(0, 5),
    breakType: center.breakType,
    defaultStartBreak: center.defaultStartBreak?.slice(0, 5) ?? "",
    defaultEndBreak: center.defaultEndBreak?.slice(0, 5) ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Basic info editing state
  const [infoForm, setInfoForm] = useState({
    name: center.name,
    phone: center.phone ?? "",
    address: center.address,
    email: center.email ?? "",
    location: center.location ?? "",
    nationality: center.nationality ?? "ES",
  });
  const [availableSubdivisions, setAvailableSubdivisions] =
    useState<Subdivision[]>(subdivisions);
  const [loadingSubdivisions, setLoadingSubdivisions] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoError, setInfoError] = useState("");
  const [infoSuccess, setInfoSuccess] = useState(false);

  // Delete state (super_admin only)
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Local holidays state
  const [localHolidays, setLocalHolidays] = useState<LocalHoliday[]>([]);
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [holidayError, setHolidayError] = useState("");
  const [holidaySuccess, setHolidaySuccess] = useState(false);
  const [savingHoliday, setSavingHoliday] = useState(false);
  const [deletingHolidayId, setDeletingHolidayId] = useState<string | null>(
    null
  );
  const [holidayYear, setHolidayYear] = useState(new Date().getFullYear());

  const t = useTranslations("dashboard.admin.centerSchedule");
  const tc = useTranslations("common");
  const locale = useLocale();

  const handleNationalityChange = async (newNationality: string) => {
    setInfoForm((prev) => ({
      ...prev,
      nationality: newNationality,
      location: "",
    }));
    setLoadingSubdivisions(true);
    try {
      const res = await fetch(`/api/subdivisions?country=${newNationality}`);
      const data = await res.json();
      setAvailableSubdivisions(data.subdivisions ?? []);
    } catch {
      setAvailableSubdivisions([]);
    } finally {
      setLoadingSubdivisions(false);
    }
  };

  // Reset holiday date when year changes and the selected date doesn't match
  useEffect(() => {
    if (holidayDate && !holidayDate.startsWith(String(holidayYear))) {
      setHolidayDate("");
    }
  }, [holidayYear, holidayDate]);

  // Load local holidays
  useEffect(() => {
    const loadHolidays = async () => {
      setLoadingHolidays(true);
      try {
        const supabase = createClient();
        const repo = new SupabaseLocalHolidayRepository(supabase);
        const useCase = new GetLocalHolidaysUseCase(repo);
        const holidays = await useCase.execute(center.id, holidayYear);
        setLocalHolidays(holidays);
      } catch {
        setHolidayError(t("errorLoadHolidays"));
      } finally {
        setLoadingHolidays(false);
      }
    };
    loadHolidays();
  }, [center.id, holidayYear, t]);

  const handleSaveInfo = async () => {
    setInfoError("");
    setInfoSuccess(false);
    if (!infoForm.name.trim() || !infoForm.address.trim()) {
      setInfoError(t("errorInfoRequired"));
      return;
    }
    setSavingInfo(true);
    try {
      const res = await fetch(`/api/admin/centers/${center.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: infoForm.name.trim(),
          address: infoForm.address.trim(),
          phone: infoForm.phone.trim() || undefined,
          email: infoForm.email.trim() || undefined,
          location: infoForm.location.trim() || undefined,
          nationality: infoForm.nationality,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setInfoError(data.error ?? t("errorSchedule"));
        return;
      }
      setInfoSuccess(true);
      router.refresh();
    } catch {
      setInfoError(t("errorConnect"));
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const supabase = createClient();
      const centerRepo = new SupabaseCenterRepository(supabase);
      const useCase = new UpdateCenterScheduleUseCase(centerRepo);

      const breakFeatureEnabled = center.enabledFeatures.includes(
        CENTER_FEATURES.BREAK
      );
      const effectiveBreakType = breakFeatureEnabled
        ? formData.breakType
        : "none";

      await useCase.execute(center.id, {
        defaultStartWorkday: `${formData.defaultStartWorkday}:00`,
        defaultEndWorkday: `${formData.defaultEndWorkday}:00`,
        breakType: effectiveBreakType,
        defaultStartBreak:
          effectiveBreakType === "scheduled"
            ? `${formData.defaultStartBreak}:00`
            : undefined,
        defaultEndBreak:
          effectiveBreakType === "scheduled"
            ? `${formData.defaultEndBreak}:00`
            : undefined,
      });

      setSuccess(true);
      router.refresh();
    } catch (e) {
      const message = e instanceof DomainError ? e.message : t("errorSchedule");
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddHoliday = async () => {
    setHolidayError("");
    setHolidaySuccess(false);
    setSavingHoliday(true);

    try {
      const supabase = createClient();
      const repo = new SupabaseLocalHolidayRepository(supabase);
      const useCase = new CreateLocalHolidayUseCase(repo);
      const created = await useCase.execute(
        center.id,
        holidayDate,
        holidayName
      );
      setLocalHolidays((prev) =>
        [...prev, created].sort((a, b) => a.date.localeCompare(b.date))
      );
      setHolidayDate("");
      setHolidayName("");
      setHolidaySuccess(true);
    } catch (e) {
      const message =
        e instanceof DomainError ? e.message : t("errorAddHoliday");
      setHolidayError(message);
    } finally {
      setSavingHoliday(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    setHolidayError("");
    setDeletingHolidayId(id);

    try {
      const supabase = createClient();
      const repo = new SupabaseLocalHolidayRepository(supabase);
      const useCase = new DeleteLocalHolidayUseCase(repo);
      await useCase.execute(id);
      setLocalHolidays((prev) => prev.filter((h) => h.id !== id));
    } catch (e) {
      const message =
        e instanceof DomainError ? e.message : t("errorDeleteHoliday");
      setHolidayError(message);
    } finally {
      setDeletingHolidayId(null);
    }
  };

  const handleDelete = async () => {
    setDeleteError("");
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/centers/${center.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error ?? t("errorDelete"));
        setConfirmDelete(false);
        return;
      }
      router.push("/dashboard/admin/centers");
      router.refresh();
    } catch {
      setDeleteError(t("errorConnect"));
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div>
      <div className="mx-auto max-w-2xl px-6 pt-6 lg:pt-8">
        <PageHeader
          title={center.name}
          description={t("pageSubtitle")}
          backHref="/dashboard/admin/centers"
          backLabel={tc("back")}
        />
      </div>

      <div className="mx-auto max-w-2xl px-6 py-8">
        <div className="space-y-6">
          {/* Basic Info Section */}
          <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Pencil
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
              {t("centerInfo")}
            </h2>

            {infoError && (
              <Alert variant="error" className="mb-5">
                {infoError}
              </Alert>
            )}
            {infoSuccess && (
              <Alert variant="success" className="mb-5">
                {t("infoUpdated")}
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="center-name">{t("name")}</Label>
                <Input
                  id="center-name"
                  type="text"
                  value={infoForm.name}
                  onChange={(e) =>
                    setInfoForm({ ...infoForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="center-address">{t("address")}</Label>
                <Input
                  id="center-address"
                  type="text"
                  value={infoForm.address}
                  onChange={(e) =>
                    setInfoForm({ ...infoForm, address: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="center-phone">{t("phone")}</Label>
                <Input
                  id="center-phone"
                  type="tel"
                  value={infoForm.phone}
                  onChange={(e) =>
                    setInfoForm({ ...infoForm, phone: e.target.value })
                  }
                  placeholder={t("phonePlaceholder")}
                  className="tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="center-email">{t("email")}</Label>
                <Input
                  id="center-email"
                  type="email"
                  value={infoForm.email}
                  onChange={(e) =>
                    setInfoForm({ ...infoForm, email: e.target.value })
                  }
                  placeholder={t("emailPlaceholder")}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="center-country">{t("country")}</Label>
                <NativeSelect
                  id="center-country"
                  value={infoForm.nationality}
                  onChange={(e) => handleNationalityChange(e.target.value)}
                >
                  {countryOptions.map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>
                      {c.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="center-location">{t("location")}</Label>
                {loadingSubdivisions ? (
                  <div className="flex h-12 items-center gap-2 text-sm text-muted-foreground">
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>{t("loadingRegions")}</span>
                  </div>
                ) : availableSubdivisions.length > 0 ? (
                  <NativeSelect
                    id="center-location"
                    value={infoForm.location}
                    onChange={(e) =>
                      setInfoForm({ ...infoForm, location: e.target.value })
                    }
                  >
                    <option value="">{t("selectRegion")}</option>
                    {availableSubdivisions.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </NativeSelect>
                ) : (
                  <Input
                    id="center-location"
                    type="text"
                    value={infoForm.location}
                    onChange={(e) =>
                      setInfoForm({ ...infoForm, location: e.target.value })
                    }
                    placeholder={t("regionPlaceholder")}
                  />
                )}
              </div>
            </div>

            <Button
              onClick={handleSaveInfo}
              disabled={savingInfo}
              className="mt-6 w-full sm:w-auto"
            >
              {savingInfo ? <Loader2 className="animate-spin" /> : <Save />}
              {savingInfo ? t("savingInfo") : t("saveInfo")}
            </Button>
          </section>

          {error && <Alert variant="error">{error}</Alert>}

          {success && <Alert variant="success">{t("scheduleUpdated")}</Alert>}

          {/* Work Schedule */}
          <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
            <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Clock
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
              {t("scheduleTitle")}
            </h2>

            <div className="grid grid-cols-2 gap-3 sm:gap-5">
              <div className="space-y-2">
                <Label htmlFor="default-start-workday">{t("entryTime")}</Label>
                <Input
                  id="default-start-workday"
                  type="time"
                  value={formData.defaultStartWorkday}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultStartWorkday: e.target.value,
                    })
                  }
                  className="tabular-nums"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-end-workday">{t("exitTime")}</Label>
                <Input
                  id="default-end-workday"
                  type="time"
                  value={formData.defaultEndWorkday}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultEndWorkday: e.target.value,
                    })
                  }
                  className="tabular-nums"
                />
              </div>
            </div>
          </section>

          {/* Break Configuration — only if super admin enabled the feature */}
          {center.enabledFeatures.includes(CENTER_FEATURES.BREAK) ? (
            <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold tracking-tight">
                <Coffee
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                {t("breakConfig")}
              </h2>

              <div className="space-y-5">
                <div className="space-y-3">
                  <p
                    id="break-type-label"
                    className="text-sm font-medium leading-none"
                  >
                    {t("breakType")}
                  </p>
                  <div
                    role="group"
                    aria-labelledby="break-type-label"
                    className="grid grid-cols-1 gap-3 sm:grid-cols-3"
                  >
                    {(
                      [
                        {
                          value: "none",
                          label: t("breakNone"),
                          desc: t("breakNoneDesc"),
                        },
                        {
                          value: "free",
                          label: t("breakFree"),
                          desc: t("breakFreeDesc"),
                        },
                        {
                          value: "scheduled",
                          label: t("breakScheduled"),
                          desc: t("breakScheduledDesc"),
                        },
                      ] as const
                    ).map((option) => {
                      const selected = formData.breakType === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              breakType: option.value,
                            })
                          }
                          className={cn(
                            "flex min-h-11 items-start justify-between gap-2 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            selected
                              ? "border-pause bg-pause-soft text-pause-text"
                              : "bg-card text-foreground hover:border-border-strong hover:bg-accent"
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold">
                              {option.label}
                            </span>
                            <span
                              className={cn(
                                "mt-0.5 block text-xs",
                                selected
                                  ? "text-pause-text/80"
                                  : "text-muted-foreground"
                              )}
                            >
                              {option.desc}
                            </span>
                          </span>
                          {selected && (
                            <Check
                              className="mt-0.5 size-4 shrink-0"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.breakType === "scheduled" && (
                  <div className="grid grid-cols-2 gap-3 sm:gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="default-start-break">
                        {t("breakStart")}
                      </Label>
                      <Input
                        id="default-start-break"
                        type="time"
                        value={formData.defaultStartBreak}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            defaultStartBreak: e.target.value,
                          })
                        }
                        className="tabular-nums"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="default-end-break">{t("breakEnd")}</Label>
                      <Input
                        id="default-end-break"
                        type="time"
                        value={formData.defaultEndBreak}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            defaultEndBreak: e.target.value,
                          })
                        }
                        className="tabular-nums"
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <Alert variant="info">
              <Coffee aria-hidden="true" />
              <span>{t("breakDisabled")}</span>
            </Alert>
          )}

          {/* Save Schedule Button */}
          <Button onClick={handleSave} disabled={saving} className="w-full">
            <Save />
            {saving ? t("saving") : t("saveSchedule")}
          </Button>

          {/* Local Holidays Section */}
          <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <CalendarDays
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                {t("localHolidays")}
              </h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setHolidayYear(holidayYear - 1)}
                  aria-label={t("previousYear")}
                >
                  <ChevronLeft />
                </Button>
                <span
                  aria-live="polite"
                  className="min-w-[4ch] text-center text-sm font-semibold tabular-nums"
                >
                  {holidayYear}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setHolidayYear(holidayYear + 1)}
                  aria-label={t("nextYear")}
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>

            <p className="mb-5 text-sm text-muted-foreground">
              {t("localHolidaysDesc")}{" "}
              <span className="font-medium text-foreground">
                {center.address}
              </span>
            </p>

            {holidayError && (
              <Alert variant="error" className="mb-5">
                {holidayError}
              </Alert>
            )}

            {holidaySuccess && (
              <Alert variant="success" className="mb-5">
                {t("holidayAdded")}
              </Alert>
            )}

            {/* Add Holiday Form */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="space-y-2 sm:w-44 sm:shrink-0">
                <Label htmlFor="holiday-date">{t("holidayDate")}</Label>
                <Input
                  id="holiday-date"
                  type="date"
                  value={holidayDate}
                  min={`${holidayYear}-01-01`}
                  max={`${holidayYear}-12-31`}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="tabular-nums"
                />
              </div>
              <div className="space-y-2 sm:min-w-0 sm:flex-1">
                <Label htmlFor="holiday-name">{t("holidayName")}</Label>
                <Input
                  id="holiday-name"
                  type="text"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  placeholder={t("holidayPlaceholder")}
                />
              </div>
              <Button
                onClick={handleAddHoliday}
                disabled={savingHoliday || !holidayDate || !holidayName.trim()}
                className="h-12 w-full sm:w-auto"
              >
                {savingHoliday ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Plus />
                )}
                {t("addHoliday")}
              </Button>
            </div>

            {/* Holidays List */}
            {loadingHolidays ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                <span>{t("loadingHolidays")}</span>
              </div>
            ) : localHolidays.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("noHolidays", { year: holidayYear })}
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {localHolidays.map((holiday) => (
                  <li
                    key={holiday.id}
                    className="flex items-center gap-3 py-1.5 pl-4 pr-1.5"
                  >
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full bg-brand"
                    />
                    <div className="min-w-0 flex-1 py-1">
                      <p className="truncate text-sm font-medium">
                        {holiday.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(
                          holiday.date + "T00:00:00"
                        ).toLocaleDateString(locale, {
                          weekday: "short",
                          day: "numeric",
                          month: "long",
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteHoliday(holiday.id)}
                      disabled={deletingHolidayId === holiday.id}
                      aria-label={t("deleteHoliday", { name: holiday.name })}
                      className="shrink-0 text-muted-foreground hover:bg-alert-soft hover:text-alert-text"
                    >
                      {deletingHolidayId === holiday.id ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <Trash2 />
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Danger Zone — super_admin only */}
          {userRole === "super_admin" && (
            <section className="rounded-xl border border-destructive/40 bg-card p-4 shadow-sm sm:p-6">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold tracking-tight">
                <AlertTriangle
                  className="size-5 text-alert-text"
                  aria-hidden="true"
                />
                {t("dangerZone")}
              </h2>
              <p className="mb-5 text-sm text-muted-foreground">
                {t("dangerDesc")}
              </p>

              {deleteError && (
                <Alert variant="error" className="mb-5">
                  {deleteError}
                </Alert>
              )}

              {!confirmDelete ? (
                <Button
                  variant="outline"
                  onClick={() => setConfirmDelete(true)}
                  className="border-destructive/40 text-alert-text hover:bg-alert-soft hover:text-alert-text"
                >
                  <Trash2 />
                  {t("deleteCenter")}
                </Button>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <p className="w-full text-sm font-medium text-alert-text sm:w-auto">
                    {t("confirmDeleteCenter")}
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Trash2 />
                    )}
                    {deleting ? t("deleting") : t("yesDelete")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmDelete(false)}
                  >
                    {tc("cancel")}
                  </Button>
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
