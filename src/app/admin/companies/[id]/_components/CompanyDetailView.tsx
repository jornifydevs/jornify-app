"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Company, Center } from "@/core/domain/entities";
import {
  ALL_CENTER_FEATURES,
  CENTER_FEATURES,
} from "@/core/domain/entities/center-feature";
import { createClient } from "@/infrastructure/supabase/client";
import { SupabaseCompanyRepository } from "@/infrastructure/supabase/repositories/supabase-company.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { UpdateCompanyUseCase } from "@/core/application/use-cases/super-admin/update-company.use-case";
import { UpdateCenterFeaturesUseCase } from "@/core/application/use-cases/super-admin/update-center-features.use-case";
import { DomainError } from "@/core/domain/errors/domain-errors";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Mail,
  FileText,
  Shield,
  Save,
  Users,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CenterWithWorkerCount extends Center {
  workerCount: number;
}

interface CompanyDetailViewProps {
  company: Company;
  centers: CenterWithWorkerCount[];
}

const FEATURE_LABELS: Record<string, string> = {
  [CENTER_FEATURES.PROFILE]: "Perfil",
  [CENTER_FEATURES.PAYROLL]: "Nóminas",
  [CENTER_FEATURES.VACATION]: "Vacaciones",
  [CENTER_FEATURES.CALENDAR]: "Calendario",
  [CENTER_FEATURES.BREAK]: "Descanso",
  [CENTER_FEATURES.SCHEDULE]: "Turnos",
};

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
      setSuccess("Datos de la empresa guardados correctamente");
      router.refresh();
    } catch (e) {
      const message =
        e instanceof DomainError ? e.message : "Error al actualizar la empresa";
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
      setSuccess("Se han guardado los cambios");
      router.refresh();
    } catch (e) {
      const message =
        e instanceof DomainError
          ? e.message
          : "Error al actualizar funcionalidades";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link
            href="/admin/companies"
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </Link>
          <div className="p-2 bg-red-600 rounded-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
            {company.name}
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                {success}
              </p>
            </div>
          )}

          {/* Company Info */}
          <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                Datos de la Empresa
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? "Cancelar" : "Editar"}
              </Button>
            </div>

            {editMode ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">
                      Nombre
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">
                      Razón Social
                    </Label>
                    <Input
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
                    <Label className="text-slate-700 dark:text-slate-200">
                      Email
                    </Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">
                      Dirección
                    </Label>
                    <Input
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
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-300">
                  <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-sm">
                    NIF:{" "}
                    <span className="text-slate-900 dark:text-white">
                      {company.nif}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-300">
                  <Building2 className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-sm">
                    Razón Social:{" "}
                    <span className="text-slate-900 dark:text-white">
                      {company.businessName}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-sm">
                    <span className="text-slate-900 dark:text-white">
                      {company.email}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  <span className="text-sm">
                    <span className="text-slate-900 dark:text-white">
                      {company.address}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Centers & Features */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-green-500 dark:text-green-400" />
              Centros y Funcionalidades
            </h2>

            {centers.length === 0 ? (
              <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-8 text-center">
                <Building2 className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400">
                  Esta empresa no tiene centros registrados
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {centers.map((center) => (
                  <div
                    key={center.id}
                    className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-slate-900 dark:text-white font-semibold">
                          {center.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {center.workerCount} trabajadores &middot;{" "}
                          <MapPin className="w-3 h-3" />
                          {center.address}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleSaveCenterFeatures(center.id)}
                        disabled={saving}
                        className="bg-green-600 hover:bg-green-700 self-start"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Guardar
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
                            onClick={() =>
                              handleToggleFeature(center.id, feature)
                            }
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                              isEnabled
                                ? "bg-green-600/20 dark:bg-green-600/30 text-green-700 dark:text-green-300 border border-green-500/50"
                                : "bg-slate-100 dark:bg-slate-700/50 text-slate-500 border border-slate-200 dark:border-slate-600/50"
                            }`}
                          >
                            {FEATURE_LABELS[feature] ?? feature}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
