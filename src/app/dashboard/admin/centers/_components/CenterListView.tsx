"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Users,
  MapPin,
  Settings,
  Plus,
  X,
  Loader2,
  LogOut,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CenterWithWorkerCount } from "@/core/application/dtos/admin-centers.dto";
import { useTranslations } from "next-intl";

interface CenterListViewProps {
  centers: CenterWithWorkerCount[];
  companyId: string;
  userRole: string;
}

interface CreateForm {
  name: string;
  address: string;
  phone: string;
  email: string;
  location: string;
}

const defaultForm: CreateForm = {
  name: "",
  address: "",
  phone: "",
  email: "",
  location: "",
};

export default function CenterListView({
  centers,
  companyId,
  userRole,
}: CenterListViewProps) {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<CreateForm>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations("dashboard.admin.centers");
  const tc = useTranslations("common");

  const FEATURE_LABELS: Record<string, string> = {
    profile: t("featureProfile"),
    payroll: t("featurePayroll"),
    vacation: t("featureVacation"),
    calendar: t("featureCalendar"),
    break: t("featureBreak"),
    schedule: t("featureSchedule"),
  };

  const DAY_TYPE_LABELS: Record<string, string> = {
    holiday: t("dayHoliday"),
    vacation: t("dayVacation"),
    sick_leave: t("daySickLeave"),
  };

  const canCreate = userRole === "admin" || userRole === "super_admin";

  const handleCreate = async () => {
    setError(null);
    if (!form.name.trim() || !form.address.trim()) {
      setError(t("errorNameRequired"));
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/centers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          location: form.location.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? t("errorCreate"));
        return;
      }

      setForm(defaultForm);
      setShowCreateForm(false);
      router.refresh();
    } catch {
      setError(t("errorConnect"));
    } finally {
      setSubmitting(false);
    }
  };

  // companyId is used implicitly via server-side auth in the API route
  void companyId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 relative flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-10 h-10 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-green-600 rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t("title")}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {centers.length} centro{centers.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          {canCreate && (
            <button
              onClick={() => {
                setShowCreateForm((v) => !v);
                setError(null);
                setForm(defaultForm);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {showCreateForm ? (
                <X className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {showCreateForm ? tc("cancel") : t("newCenter")}
            </button>
          )}
          <form action="/auth/signout" method="post">
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Create form */}
        {showCreateForm && (
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-green-500/30 p-6">
            <h2 className="text-sm font-medium text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-green-400" />
              {t("createCenterTitle")}
            </h2>

            {error && (
              <p className="text-xs text-red-400 font-medium mb-4">{error}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  {t("nameField")}
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Centro Norte, Almacén Principal..."
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  {t("addressField")}
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="Calle Mayor 1, Madrid"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  {t("phone")}
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder="612 345 678"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  {t("email")}
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder="centro@empresa.com"
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  {t("location")}
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="Madrid, Barcelona..."
                  className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg px-3 py-2 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-green-500 dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={submitting}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {t("createBtn")}
            </button>
          </div>
        )}

        {centers.length === 0 && !showCreateForm ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t("noCenters")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {centers.map((center) => (
              <Card
                key={center.id}
                className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-slate-900 dark:text-white text-base flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-green-400" />
                      {center.name}
                    </CardTitle>
                    <Link
                      href={`/dashboard/admin/centers/${center.id}`}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      title={t("configureSchedule")}
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Basic info */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span>{center.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Users className="w-4 h-4" />
                      <span>
                        {center.workerCount}{" "}
                        {center.workerCount !== 1
                          ? t("workerCountPlural")
                          : t("workerCount")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-700">
                    {/* Features (read-only) */}
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5">
                        {t("featuresTitle")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {center.enabledFeatures.length > 0 ? (
                          center.enabledFeatures.map((f) => (
                            <span
                              key={f}
                              className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800 border border-green-300 dark:bg-green-600/20 dark:text-green-300 dark:border-green-500/40"
                            >
                              {FEATURE_LABELS[f] ?? f}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">
                            {t("noFeatures")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Day types (read-only) */}
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5">
                        {t("dayTypesTitle")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {center.allowedDayTypes.length > 0 ? (
                          center.allowedDayTypes.map((d) => (
                            <span
                              key={d}
                              className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-600/20 dark:text-blue-300 dark:border-blue-500/40"
                            >
                              {DAY_TYPE_LABELS[d] ?? d}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-500">
                            {t("noDayTypes")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
