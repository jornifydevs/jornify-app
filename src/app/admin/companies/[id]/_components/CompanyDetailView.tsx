"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Company, Center } from "@/core/domain/entities";
import { ALL_CENTER_FEATURES } from "@/core/domain/entities/center-feature";
import { createClient } from "@/infrastructure/supabase/client";
import { SupabaseCompanyRepository } from "@/infrastructure/supabase/repositories/supabase-company.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { UpdateCompanyUseCase } from "@/core/application/use-cases/super-admin/update-company.use-case";
import { UpdateCenterFeaturesUseCase } from "@/core/application/use-cases/super-admin/update-center-features.use-case";
import { DomainError } from "@/core/domain/errors/domain-errors";
import {
  ArrowLeft,
  Building2,
  Check,
  MapPin,
  Mail,
  FileText,
  Shield,
  Save,
  Users,
  Settings,
} from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CenterWithWorkerCount extends Center {
  workerCount: number;
}

interface CompanyDetailViewProps {
  company: Company;
  centers: CenterWithWorkerCount[];
}

export default function CompanyDetailView({
  company,
  centers,
}: CompanyDetailViewProps) {
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: company.name,
    businessName: company.businessName,
    address: company.address,
    email: company.email,
  });
  const [centerFeatures, setCenterFeatures] = useState<
    Record<string, string[]>
  >(Object.fromEntries(centers.map((c) => [c.id, [...c.enabledFeatures]])));
  const router = useRouter();
  const t = useTranslations("superAdmin");
  const tc = useTranslations("common");

  const handleSaveCompany = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const supabase = createClient();
      const companyRepo = new SupabaseCompanyRepository(supabase);
      const useCase = new UpdateCompanyUseCase(companyRepo);

      await useCase.execute(company.id, formData);
      setEditMode(false);
      setSuccess(t("companyDetail.companySaved"));
      router.refresh();
    } catch (e) {
      const message =
        e instanceof DomainError
          ? e.message
          : t("companyDetail.errorUpdateCompany");
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFeature = (centerId: string, feature: string) => {
    setCenterFeatures((prev) => {
      const current = prev[centerId] ?? [];
      const updated = current.includes(feature)
        ? current.filter((f) => f !== feature)
        : [...current, feature];
      return { ...prev, [centerId]: updated };
    });
  };

  const handleSaveCenterFeatures = async (centerId: string) => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const supabase = createClient();
      const centerRepo = new SupabaseCenterRepository(supabase);
      const useCase = new UpdateCenterFeaturesUseCase(centerRepo);

      await useCase.execute(centerId, {
        enabledFeatures: centerFeatures[centerId],
      });
      setSuccess(t("companyDetail.featuresSaved"));
      router.refresh();
    } catch (e) {
      const message =
        e instanceof DomainError
          ? e.message
          : t("companyDetail.errorUpdateFeatures");
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3">
          <Link
            href="/admin/companies"
            aria-label={tc("back")}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-track focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </Link>
          <div className="hidden size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground sm:flex">
            <Shield className="size-5" aria-hidden="true" />
          </div>
          <h1 className="min-w-0 truncate text-lg font-semibold tracking-tight">
            {company.name}
          </h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="space-y-8">
          {error && <Alert variant="error">{error}</Alert>}

          {success && <Alert variant="success">{success}</Alert>}

          {/* Company Info */}
          <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <Building2
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                {t("companyDetail.companyData")}
              </h2>
              <Button variant="outline" onClick={() => setEditMode(!editMode)}>
                {editMode ? tc("cancel") : tc("edit")}
              </Button>
            </div>

            {editMode ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">{t("fields.name")}</Label>
                    <Input
                      id="company-name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-business-name">
                      {t("fields.businessName")}
                    </Label>
                    <Input
                      id="company-business-name"
                      value={formData.businessName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          businessName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-email">{t("fields.email")}</Label>
                    <Input
                      id="company-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-address">
                      {t("fields.address")}
                    </Label>
                    <Input
                      id="company-address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveCompany}
                  disabled={saving}
                  className="w-full sm:w-auto"
                >
                  <Save />
                  {saving
                    ? t("companyDetail.saving")
                    : t("companyDetail.saveChanges")}
                </Button>
              </div>
            ) : (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div className="min-w-0">
                  <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <FileText className="size-4" aria-hidden="true" />
                    {t("fields.nif")}
                  </dt>
                  <dd className="mt-1 break-words font-medium">
                    {company.nif}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Building2 className="size-4" aria-hidden="true" />
                    {t("fields.businessName")}
                  </dt>
                  <dd className="mt-1 break-words font-medium">
                    {company.businessName}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Mail className="size-4" aria-hidden="true" />
                    {t("fields.email")}
                  </dt>
                  <dd className="mt-1 break-words font-medium">
                    {company.email}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-4" aria-hidden="true" />
                    {t("fields.address")}
                  </dt>
                  <dd className="mt-1 break-words font-medium">
                    {company.address}
                  </dd>
                </div>
              </dl>
            )}
          </section>

          {/* Centers & Features */}
          <section>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Settings
                className="size-5 text-muted-foreground"
                aria-hidden="true"
              />
              {t("companyDetail.centersAndFeatures")}
            </h2>

            {centers.length === 0 ? (
              <div className="rounded-xl border bg-card p-8 text-center shadow-sm">
                <Building2
                  className="mx-auto size-10 text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="mt-3 font-medium">
                  {t("companyDetail.noCenters")}
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {centers.map((center) => (
                  <div
                    key={center.id}
                    className="rounded-xl border bg-card p-5 shadow-sm"
                  >
                    <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                      <div className="min-w-0">
                        <h3 className="font-semibold">{center.name}</h3>
                        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground">
                          <Users className="size-3.5" aria-hidden="true" />
                          <span className="tabular-nums">
                            {t("companyDetail.workerCount", {
                              count: center.workerCount,
                            })}
                          </span>
                          <span aria-hidden="true">&middot;</span>
                          <MapPin className="size-3.5" aria-hidden="true" />
                          <span className="break-words">{center.address}</span>
                        </p>
                      </div>
                      <Button
                        onClick={() => handleSaveCenterFeatures(center.id)}
                        disabled={saving}
                        className="self-start"
                      >
                        <Save />
                        {tc("save")}
                      </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {ALL_CENTER_FEATURES.map((feature) => {
                        const isEnabled = (
                          centerFeatures[center.id] ?? []
                        ).includes(feature);
                        return (
                          <button
                            key={feature}
                            type="button"
                            aria-pressed={isEnabled}
                            onClick={() =>
                              handleToggleFeature(center.id, feature)
                            }
                            className={cn(
                              "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:min-h-9",
                              isEnabled
                                ? "border-transparent bg-live-soft text-live-text"
                                : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
                            )}
                          >
                            {isEnabled && (
                              <Check className="size-4" aria-hidden="true" />
                            )}
                            {t(`features.${feature}`)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
