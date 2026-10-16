"use client";

import Image from "next/image";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Building2, Loader2, Check, Camera, Save } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
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
    <div>
      <div className="mx-auto max-w-2xl px-6 pt-6 lg:pt-8">
        <PageHeader title={t("title")} description={initialName} />
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Logo Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
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
                  aria-label={t("changeLogo")}
                  className="group relative cursor-pointer rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={t("logoSection")}
                      width={120}
                      height={120}
                      className="rounded-xl border-2 bg-secondary object-contain p-2 transition-colors group-hover:border-border-strong"
                    />
                  ) : (
                    <div className="flex size-[120px] items-center justify-center rounded-xl border-2 bg-secondary transition-colors group-hover:border-border-strong">
                      <Building2
                        className="size-12 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    {isUploadingLogo ? (
                      <Loader2
                        className="size-8 animate-spin text-white"
                        aria-hidden="true"
                      />
                    ) : (
                      <Camera
                        className="size-8 text-white"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogoClick}
                  disabled={isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {t("uploading")}
                    </>
                  ) : (
                    t("changeLogo")
                  )}
                </Button>

                {logoError && (
                  <Alert
                    variant="error"
                    className="w-full justify-center text-center"
                  >
                    {logoError}
                  </Alert>
                )}
                {logoSuccess && (
                  <Alert variant="success" className="w-full justify-center">
                    <Check />
                    {t("logoUpdated")}
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Company Info Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                {t("dataSection")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* NIF — read-only */}
                <div className="space-y-2">
                  <Label htmlFor="company-nif">{t("nif")}</Label>
                  <Input
                    id="company-nif"
                    value={nif}
                    disabled
                    aria-describedby="company-nif-hint"
                    className="bg-secondary"
                  />
                  <p
                    id="company-nif-hint"
                    className="text-sm text-muted-foreground"
                  >
                    {t("nifReadOnly")}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-trade-name">{t("tradeName")}</Label>
                    <Input
                      id="company-trade-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("tradeNamePlaceholder")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-business-name">
                      {t("businessName")}
                    </Label>
                    <Input
                      id="company-business-name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder={t("businessNamePlaceholder")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-address">{t("address")}</Label>
                  <Input
                    id="company-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={t("addressPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-email">{t("contactEmail")}</Label>
                  <Input
                    id="company-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("contactEmailPlaceholder")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company-country">{t("country")}</Label>
                  <NativeSelect
                    id="company-country"
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                  >
                    {countryOptions.map((c) => (
                      <option key={c.isoCode} value={c.isoCode}>
                        {c.name}
                      </option>
                    ))}
                  </NativeSelect>
                </div>

                {saveError && <Alert variant="error">{saveError}</Alert>}

                {saveSuccess && (
                  <Alert variant="success">
                    <Check />
                    {t("dataUpdated")}
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {t("saving")}
                    </>
                  ) : (
                    <>
                      <Save />
                      {t("saveChanges")}
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
