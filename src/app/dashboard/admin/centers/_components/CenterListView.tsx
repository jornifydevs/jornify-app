"use client";

import { useState, type ComponentProps } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  MapPin,
  Settings,
  Plus,
  X,
  Loader2,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CenterWithWorkerCount } from "@/core/application/dtos/admin-centers.dto";
import { useTranslations } from "next-intl";

type BadgeTone = NonNullable<ComponentProps<typeof StatusBadge>["tone"]>;

const DAY_TYPE_TONES: Record<string, BadgeTone> = {
  holiday: "brand",
  vacation: "pause",
  sick_leave: "alert",
};

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
    <div>
      <div className="mx-auto max-w-7xl px-6 pt-6 lg:pt-8">
        <PageHeader
          title={t("title")}
          description={t("count", { count: centers.length })}
          actions={
            canCreate && (
              <Button
                size="sm"
                variant={showCreateForm ? "outline" : "default"}
                onClick={() => {
                  setShowCreateForm((v) => !v);
                  setError(null);
                  setForm(defaultForm);
                }}
              >
                {showCreateForm ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {showCreateForm ? tc("cancel") : t("newCenter")}
              </Button>
            )
          }
        />
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {/* Create form */}
        {showCreateForm && (
          <section className="rounded-xl border bg-card p-4 shadow-sm sm:p-6">
            <h2 className="mb-5 text-lg font-semibold tracking-tight">
              {t("createCenterTitle")}
            </h2>

            {error && (
              <Alert variant="error" className="mb-5">
                {error}
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-center-name">{t("nameField")}</Label>
                <Input
                  id="new-center-name"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder={t("namePlaceholder")}
                  aria-required="true"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-center-address">{t("addressField")}</Label>
                <Input
                  id="new-center-address"
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder={t("addressPlaceholder")}
                  aria-required="true"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-center-phone">{t("phone")}</Label>
                <Input
                  id="new-center-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  placeholder={t("phonePlaceholder")}
                  className="tabular-nums"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-center-email">{t("email")}</Label>
                <Input
                  id="new-center-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  placeholder={t("emailPlaceholder")}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="new-center-location">{t("location")}</Label>
                <Input
                  id="new-center-location"
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder={t("locationPlaceholder")}
                />
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="mt-6 w-full sm:w-auto"
            >
              {submitting && <Loader2 className="animate-spin" />}
              {t("createBtn")}
            </Button>
          </section>
        )}

        {centers.length === 0 && !showCreateForm ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <Building2
              className="size-10 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="font-medium">{t("noCenters")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
            {centers.map((center) => (
              <Card key={center.id}>
                <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="flex min-w-0 items-center gap-2 text-base font-semibold leading-tight tracking-tight">
                      <Building2
                        className="size-5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="truncate">{center.name}</span>
                    </h2>
                    <Link
                      href={`/dashboard/admin/centers/${center.id}`}
                      className="-my-2 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      title={t("configureSchedule")}
                      aria-label={t("configureSchedule")}
                    >
                      <Settings className="size-5" aria-hidden="true" />
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
                  {/* Basic info */}
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <MapPin className="size-4 shrink-0" aria-hidden="true" />
                      <span className="break-words">{center.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="size-4 shrink-0" aria-hidden="true" />
                      <span className="tabular-nums">
                        {center.workerCount}{" "}
                        {center.workerCount !== 1
                          ? t("workerCountPlural")
                          : t("workerCount")}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    {/* Features (read-only) */}
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        {t("featuresTitle")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {center.enabledFeatures.length > 0 ? (
                          center.enabledFeatures.map((f) => (
                            <StatusBadge key={f} size="sm" dot={false}>
                              {FEATURE_LABELS[f] ?? f}
                            </StatusBadge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("noFeatures")}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Day types (read-only) */}
                    <div>
                      <p className="mb-2 text-xs font-medium text-muted-foreground">
                        {t("dayTypesTitle")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {center.allowedDayTypes.length > 0 ? (
                          center.allowedDayTypes.map((d) => (
                            <StatusBadge
                              key={d}
                              size="sm"
                              tone={DAY_TYPE_TONES[d] ?? "neutral"}
                            >
                              {DAY_TYPE_LABELS[d] ?? d}
                            </StatusBadge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
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
      </div>
    </div>
  );
}
