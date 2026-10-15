"use client";

import Image from "next/image";
import { useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Building2,
  Loader2,
  Check,
  Camera,
  Save,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompanyProfile } from "../_hooks/useCompanyProfile";

interface CountryOption {
  isoCode: string;
  name: string;
}

interface CompanyProfileViewProps {
  companyId: string;
  nif: string;
  initialName: string;
  initialBusinessName: string;
  initialAddress: string;
  initialEmail: string;
  initialNationality: string;
  countryOptions: CountryOption[];
  initialLogoUrl?: string;
}

export default function CompanyProfileView({
  companyId,
  nif,
  initialName,
  initialBusinessName,
  initialAddress,
  initialEmail,
  initialNationality,
  countryOptions,
  initialLogoUrl,
}: CompanyProfileViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("dashboard.admin.company");
  const tc = useTranslations("common");

  const {
    name,
    setName,
    businessName,
    setBusinessName,
    address,
    setAddress,
    email,
    setEmail,
    isSaving,
    isUploadingLogo,
    saveError,
    logoError,
    saveSuccess,
    logoSuccess,
    logoUrl,
    nationality,
    setNationality,
    saveInfo,
    uploadLogo,
  } = useCompanyProfile({
    companyId,
    initialName,
    initialBusinessName,
    initialAddress,
    initialEmail,
    initialNationality,
    initialLogoUrl,
  });

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadLogo(file);
    }
    e.target.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveInfo();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 relative flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </Link>
          <div className="p-2 bg-purple-600 rounded-lg">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {initialName}
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
          {/* Logo Section */}
          <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Camera className="w-5 h-5" />
                {t("logoSection")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={handleLogoClick}
                  disabled={isUploadingLogo}
                  className="relative group cursor-pointer"
                >
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={t("logoSection")}
                      width={120}
                      height={120}
                      className="rounded-xl object-contain border-2 border-slate-600 group-hover:border-purple-500 transition-colors bg-slate-900/50 p-2"
                    />
                  ) : (
                    <div className="w-[120px] h-[120px] rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center border-2 border-slate-300 dark:border-slate-600 group-hover:border-purple-500 transition-colors">
                      <Building2 className="w-12 h-12 text-slate-500 dark:text-slate-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {isUploadingLogo ? (
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                      <Camera className="w-8 h-8 text-white" />
                    )}
                  </div>
                </button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLogoClick}
                  disabled={isUploadingLogo}
                  className="bg-slate-200 text-slate-700 border-slate-300 hover:bg-white dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-transparent dark:hover:text-slate-300"
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("uploading")}
                    </>
                  ) : (
                    t("changeLogo")
                  )}
                </Button>

                {logoError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm w-full text-center">
                    {logoError}
                  </div>
                )}
                {logoSuccess && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center justify-center gap-2 w-full">
                    <Check className="w-4 h-4" />
                    {t("logoUpdated")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Info Form */}
          <Card className="bg-white/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <Building2 className="w-5 h-5" />
                {t("dataSection")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* NIF — read-only */}
                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">
                    NIF
                  </Label>
                  <Input
                    value={nif}
                    disabled
                    className="bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed dark:bg-slate-700/50 dark:border-slate-600"
                  />
                  <p className="text-xs text-slate-500">{t("nifReadOnly")}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">
                      {t("tradeName")}
                    </Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      placeholder={t("tradeNamePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">
                      {t("businessName")}
                    </Label>
                    <Input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                      placeholder={t("businessNamePlaceholder")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">
                    {t("address")}
                  </Label>
                  <Input
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    placeholder={t("addressPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">
                    {t("contactEmail")}
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
                    placeholder={t("contactEmailPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-700 dark:text-slate-300">
                    {t("country")}
                  </Label>
                  <select
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:[&>option]:bg-slate-800"
                  >
                    {countryOptions.map((c) => (
                      <option key={c.isoCode} value={c.isoCode}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {saveError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {saveError}
                  </div>
                )}

                {saveSuccess && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {t("dataUpdated")}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t("saving")}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {t("saveChanges")}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
