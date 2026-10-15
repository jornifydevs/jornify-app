"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Coffee,
  Save,
  Building2,
  CalendarDays,
  Plus,
  Trash2,
  Loader2,
  Pencil,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 relative flex items-center gap-3">
          <Link
            href="/dashboard/admin/centers"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </Link>
          <div className="p-2 bg-blue-600 rounded-lg">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              {center.name}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("pageSubtitle")}
            </p>
          </div>
          <form action="/auth/signout" method="post" className="ml-auto">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{tc("signOut")}</span>
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Basic Info Section */}
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-green-400" />
              {t("centerInfo")}
            </h2>

            {infoError && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg mb-4">
                <p className="text-sm text-red-400">{infoError}</p>
              </div>
            )}
            {infoSuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg mb-4">
                <p className="text-sm text-green-400">{t("infoUpdated")}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-slate-700 dark:text-slate-200">
                  {t("name")}
                </Label>
                <Input
                  type="text"
                  value={infoForm.name}
                  onChange={(e) =>
                    setInfoForm({ ...infoForm, name: e.target.value })
                  }
                  className="bg-white border-slate-300 text-slate-900 dark:bg-slate-900/50 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-slate-700 dark:text-slate-200">
                  {t("address")}
                </Label>
                <Input
                  type="text"
                  value={infoForm.address}
                  onChange={(e) =>
                    setInfoForm({ ...infoForm, address: e.target.value })
                  }
                  className="bg-white border-slate-300 text-slate-900 dark:bg-slate-900/50 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-200">
                  {t("phone")}
                </Label>
                <Input
                  type="tel"
                  value={infoForm.phone}
                  onChange={(e) =>
                    setInfoForm({ ...infoForm, phone: e.target.value })
                  }
                  placeholder="612 345 678"
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-900/50 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-200">
                  {t("email")}
                </Label>
                <Input
                  type="email"
                  value={infoForm.email}
                  onChange={(e) =>
                    setInfoForm({ ...infoForm, email: e.target.value })
                  }
                  placeholder="centro@empresa.com"
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-900/50 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-600"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-slate-700 dark:text-slate-200">
                  {t("country")}
                </Label>
                <select
                  value={infoForm.nationality}
                  onChange={(e) => handleNationalityChange(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900/50 dark:text-white dark:[&>option]:bg-slate-800"
                >
                  {countryOptions.map((c) => (
                    <option key={c.isoCode} value={c.isoCode}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-slate-700 dark:text-slate-200">
                  {t("location")}
                </Label>
                {loadingSubdivisions ? (
                  <div className="flex items-center gap-2 py-2 text-slate-500 dark:text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">{t("loadingRegions")}</span>
                  </div>
                ) : availableSubdivisions.length > 0 ? (
                  <select
                    value={infoForm.location}
                    onChange={(e) =>
                      setInfoForm({ ...infoForm, location: e.target.value })
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-900/50 dark:text-white dark:[&>option]:bg-slate-800"
                  >
                    <option value="">{t("selectRegion")}</option>
                    {availableSubdivisions.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type="text"
                    value={infoForm.location}
                    onChange={(e) =>
                      setInfoForm({ ...infoForm, location: e.target.value })
                    }
                    placeholder={t("regionPlaceholder")}
                    className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-900/50 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-600"
                  />
                )}
              </div>
            </div>

            <Button
              onClick={handleSaveInfo}
              disabled={savingInfo}
              className="mt-4 bg-green-600 hover:bg-green-700"
            >
              {savingInfo ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {savingInfo ? t("savingInfo") : t("saveInfo")}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
              <p className="text-sm text-green-400">{t("scheduleUpdated")}</p>
            </div>
          )}

          {/* Work Schedule */}
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              {t("scheduleTitle")}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-200">
                  {t("entryTime")}
                </Label>
                <Input
                  type="time"
                  value={formData.defaultStartWorkday}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultStartWorkday: e.target.value,
                    })
                  }
                  className="bg-white border-slate-300 text-slate-900 dark:bg-slate-900/50 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-slate-200">
                  {t("exitTime")}
                </Label>
                <Input
                  type="time"
                  value={formData.defaultEndWorkday}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      defaultEndWorkday: e.target.value,
                    })
                  }
                  className="bg-white border-slate-300 text-slate-900 dark:bg-slate-900/50 dark:border-slate-600 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Break Configuration — only if super admin enabled the feature */}
          {center.enabledFeatures.includes(CENTER_FEATURES.BREAK) ? (
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-400" />
                {t("breakConfig")}
              </h2>

              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-slate-700 dark:text-slate-200">
                    {t("breakType")}
                  </Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    ).map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, breakType: option.value })
                        }
                        className={`p-3 rounded-lg border text-left transition-all ${
                          formData.breakType === option.value
                            ? "bg-amber-600/20 border-amber-500/50 text-amber-300"
                            : "bg-slate-50 border-slate-300 text-slate-500 hover:border-slate-400 dark:bg-slate-900/50 dark:border-slate-600 dark:text-slate-400 dark:hover:border-slate-500"
                        }`}
                      >
                        <p className="font-medium text-sm">{option.label}</p>
                        <p className="text-xs mt-0.5 opacity-75">
                          {option.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.breakType === "scheduled" && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-200">
                        {t("breakStart")}
                      </Label>
                      <Input
                        type="time"
                        value={formData.defaultStartBreak}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            defaultStartBreak: e.target.value,
                          })
                        }
                        className="bg-white border-slate-300 text-slate-900 dark:bg-slate-900/50 dark:border-slate-600 dark:text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-700 dark:text-slate-200">
                        {t("breakEnd")}
                      </Label>
                      <Input
                        type="time"
                        value={formData.defaultEndBreak}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            defaultEndBreak: e.target.value,
                          })
                        }
                        className="bg-white border-slate-300 text-slate-900 dark:bg-slate-900/50 dark:border-slate-600 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <Coffee className="w-5 h-5" />
                <p className="text-sm">{t("breakDisabled")}</p>
              </div>
            </div>
          )}

          {/* Save Schedule Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-base font-semibold"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? t("saving") : t("saveSchedule")}
          </Button>

          {/* Local Holidays Section */}
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-orange-400" />
                {t("localHolidays")}
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHolidayYear(holidayYear - 1)}
                  className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 px-2"
                >
                  &larr;
                </Button>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 min-w-[4ch] text-center">
                  {holidayYear}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHolidayYear(holidayYear + 1)}
                  className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-700 px-2"
                >
                  &rarr;
                </Button>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {t("localHolidaysDesc")}{" "}
              <span className="text-slate-600 dark:text-slate-400">
                {center.address}
              </span>
            </p>

            {holidayError && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg mb-4">
                <p className="text-sm text-red-400">{holidayError}</p>
              </div>
            )}

            {holidaySuccess && (
              <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg mb-4">
                <p className="text-sm text-green-400">{t("holidayAdded")}</p>
              </div>
            )}

            {/* Add Holiday Form */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 space-y-1">
                <Label className="text-slate-700 dark:text-slate-300 text-xs">
                  {t("holidayDate")}
                </Label>
                <Input
                  type="date"
                  value={holidayDate}
                  min={`${holidayYear}-01-01`}
                  max={`${holidayYear}-12-31`}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900 dark:bg-slate-900/50 dark:border-slate-600 dark:text-white"
                />
              </div>
              <div className="flex-[2] space-y-1">
                <Label className="text-slate-700 dark:text-slate-300 text-xs">
                  {t("holidayName")}
                </Label>
                <Input
                  type="text"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  placeholder={t("holidayPlaceholder")}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-900/50 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-600"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddHoliday}
                  disabled={
                    savingHoliday || !holidayDate || !holidayName.trim()
                  }
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {savingHoliday ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span className="ml-1 sm:hidden lg:inline">
                    {t("addHoliday")}
                  </span>
                </Button>
              </div>
            </div>

            {/* Holidays List */}
            {loadingHolidays ? (
              <div className="flex items-center justify-center py-6 text-slate-500 dark:text-slate-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{t("loadingHolidays")}</span>
              </div>
            ) : localHolidays.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
                {t("noHolidays", { year: holidayYear })}
              </p>
            ) : (
              <div className="space-y-2">
                {localHolidays.map((holiday) => (
                  <div
                    key={holiday.id}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-slate-900 dark:text-slate-200">
                          {holiday.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(
                            holiday.date + "T00:00:00"
                          ).toLocaleDateString(locale, {
                            weekday: "short",
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteHoliday(holiday.id)}
                      disabled={deletingHolidayId === holiday.id}
                      className="text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                    >
                      {deletingHolidayId === holiday.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Danger Zone — super_admin only */}
          {userRole === "super_admin" && (
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-red-500/30 p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                {t("dangerZone")}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                {t("dangerDesc")}
              </p>

              {deleteError && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg mb-4">
                  <p className="text-sm text-red-400">{deleteError}</p>
                </div>
              )}

              {!confirmDelete ? (
                <Button
                  variant="destructive"
                  onClick={() => setConfirmDelete(true)}
                  className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t("deleteCenter")}
                </Button>
              ) : (
                <div className="flex items-center gap-3">
                  <p className="text-sm text-red-300 font-medium">
                    {t("confirmDeleteCenter")}
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    {deleting ? t("deleting") : t("yesDelete")}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmDelete(false)}
                    className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    {tc("cancel")}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
