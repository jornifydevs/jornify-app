"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
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
import { Alert } from "@/components/ui/alert";
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
  const t = useTranslations("superAdmin");
  const tc = useTranslations("common");

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
        e instanceof DomainError ? e.message : t("companyList.errorCreate");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t("companyList.confirmDelete", { name }))) return;

    try {
      const supabase = createClient();
      const companyRepo = new SupabaseCompanyRepository(supabase);
      const centerRepo = new SupabaseCenterRepository(supabase);
      const useCase = new DeleteCompanyUseCase(companyRepo, centerRepo);

      await useCase.execute(id);
      router.refresh();
    } catch (e) {
      const message =
        e instanceof DomainError ? e.message : t("companyList.errorDelete");
      setError(message);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/admin"
              aria-label={tc("back")}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-track focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <ArrowLeft className="size-5" aria-hidden="true" />
            </Link>
            <div className="hidden size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground sm:flex">
              <Shield className="size-5" aria-hidden="true" />
            </div>
            <h1 className="truncate text-lg font-semibold tracking-tight">
              {t("companyManagement")}
            </h1>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? (
              <>
                <X />
                {tc("cancel")}
              </>
            ) : (
              <>
                <Plus />
                {t("companyList.newCompany")}
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">
        <div className="space-y-6">
          {error && <Alert variant="error">{error}</Alert>}

          {/* Create Form */}
          {showForm && (
            <section className="rounded-xl border bg-card p-5 shadow-sm sm:p-6">
              <h2 className="mb-5 text-lg font-semibold tracking-tight">
                {t("companyList.newCompany")}
              </h2>
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-company-nif">{t("fields.nif")}</Label>
                    <Input
                      id="new-company-nif"
                      value={formData.nif}
                      onChange={(e) =>
                        setFormData({ ...formData, nif: e.target.value })
                      }
                      required
                      placeholder="B12345678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-company-name">{t("fields.name")}</Label>
                    <Input
                      id="new-company-name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                      placeholder={t("companyList.namePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-company-business-name">
                      {t("fields.businessName")}
                    </Label>
                    <Input
                      id="new-company-business-name"
                      value={formData.businessName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          businessName: e.target.value,
                        })
                      }
                      required
                      placeholder={t("companyList.businessNamePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-company-email">
                      {t("fields.email")}
                    </Label>
                    <Input
                      id="new-company-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      placeholder={t("companyList.emailPlaceholder")}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-company-address">
                    {t("fields.address")}
                  </Label>
                  <Input
                    id="new-company-address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                    placeholder={t("companyList.addressPlaceholder")}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  {loading
                    ? t("companyList.creating")
                    : t("companyList.createCompany")}
                </Button>
              </form>
            </section>
          )}

          {/* Search */}
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("companyList.searchPlaceholder")}
              aria-label={tc("search")}
              className="pl-10"
            />
          </div>

          {/* Companies List */}
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <Building2
                className="mx-auto size-10 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-3 font-medium">{t("companyList.empty")}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filtered.map((company) => (
                <div
                  key={company.id}
                  className="flex flex-col justify-between gap-4 rounded-xl border bg-card p-5 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground">
                      <Building2 className="size-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">{company.name}</h2>
                      <p className="break-words text-sm text-muted-foreground">
                        {t("companyList.nifValue", { nif: company.nif })}{" "}
                        &middot; {company.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline">
                      <Link href={`/admin/companies/${company.id}`}>
                        <Eye />
                        {tc("view")}
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="text-alert-text hover:bg-alert-soft hover:text-alert-text"
                      onClick={() => handleDelete(company.id, company.name)}
                    >
                      <Trash2 />
                      {tc("delete")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
