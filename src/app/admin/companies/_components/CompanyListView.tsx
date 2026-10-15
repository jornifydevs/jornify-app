"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Company } from "@/core/domain/entities";
import { createClient } from "@/infrastructure/supabase/client";
import { SupabaseCompanyRepository } from "@/infrastructure/supabase/repositories/supabase-company.repository";
import { CreateCompanyUseCase } from "@/core/application/use-cases/super-admin/create-company.use-case";
import { DeleteCompanyUseCase } from "@/core/application/use-cases/super-admin/delete-company.use-case";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { DomainError } from "@/core/domain/errors/domain-errors";
import {
  ArrowLeft,
  Building2,
  Plus,
  Trash2,
  Eye,
  Shield,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CompanyListViewProps {
  companies: Company[];
}

export default function CompanyListView({ companies }: CompanyListViewProps) {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nif: "",
    name: "",
    businessName: "",
    address: "",
    email: "",
  });
  const router = useRouter();

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.nif.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const companyRepo = new SupabaseCompanyRepository(supabase);
      const useCase = new CreateCompanyUseCase(companyRepo);

      await useCase.execute(formData);
      setShowForm(false);
      setFormData({
        nif: "",
        name: "",
        businessName: "",
        address: "",
        email: "",
      });
      router.refresh();
    } catch (e) {
      const message =
        e instanceof DomainError ? e.message : "Error al crear la empresa";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `¿Eliminar la empresa "${name}"? Esta acción no se puede deshacer.`
      )
    )
      return;

    try {
      const supabase = createClient();
      const companyRepo = new SupabaseCompanyRepository(supabase);
      const centerRepo = new SupabaseCenterRepository(supabase);
      const useCase = new DeleteCompanyUseCase(companyRepo, centerRepo);

      await useCase.execute(id);
      router.refresh();
    } catch (e) {
      const message =
        e instanceof DomainError ? e.message : "Error al eliminar la empresa";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </Link>
            <div className="p-2 bg-red-600 rounded-lg">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              Gestión de Empresas
            </h1>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {showForm ? (
              <>
                <X className="w-4 h-4 mr-2" /> Cancelar
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" /> Nueva Empresa
              </>
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Create Form */}
          {showForm && (
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-blue-500/30 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Nueva Empresa
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">
                      NIF
                    </Label>
                    <Input
                      value={formData.nif}
                      onChange={(e) =>
                        setFormData({ ...formData, nif: e.target.value })
                      }
                      required
                      placeholder="B12345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-200">
                      Nombre
                    </Label>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      placeholder="Nombre de la empresa"
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
                      required
                      placeholder="Razón social"
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
                      required
                      placeholder="empresa@email.com"
                    />
                  </div>
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
                    required
                    placeholder="Dirección completa"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Creando..." : "Crear Empresa"}
                </Button>
              </form>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o NIF..."
              className="pl-10"
            />
          </div>

          {/* Companies List */}
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400">
                No se encontraron empresas
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.map((company) => (
                <div
                  key={company.id}
                  className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600/10 dark:bg-blue-600/20 rounded-lg">
                      <Building2 className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-slate-900 dark:text-white font-semibold">
                        {company.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        NIF: {company.nif} &middot; {company.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/companies/${company.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" /> Ver
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-300 dark:border-red-600/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-600/20"
                      onClick={() => handleDelete(company.id, company.name)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
