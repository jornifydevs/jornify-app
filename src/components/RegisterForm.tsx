"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Country } from "country-state-city";
import { createClient } from "@/infrastructure/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { StatusBadge } from "@/components/ui/status-badge";
import { JornifyLogo } from "@/components/JornifyLogo";
import { Check, CheckCircle2, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { ALL_PLANS } from "@/core/domain/entities";
import type { PlanId } from "@/core/domain/entities";
import { cn } from "@/lib/utils";

const ALL_COUNTRIES = Country.getAllCountries().sort((a, b) =>
  a.name.localeCompare(b.name)
);

type RegisterType = "worker" | "company";

const linkClass =
  "inline-flex min-h-11 items-center rounded-sm font-medium text-brand-text underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const segmentClass =
  "min-h-11 flex-1 rounded-full px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const segmentActiveClass =
  "bg-card text-foreground shadow-sm ring-1 ring-border";
const segmentInactiveClass = "text-muted-foreground hover:text-foreground";

const invalidInputClass =
  "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20";

const sectionLabelClass =
  "border-b pb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground";

export function RegisterForm() {
  const [registerType, setRegisterType] = useState<RegisterType>("worker");
  const [companyStep, setCompanyStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("free");

  // Worker fields
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyCode, setCompanyCode] = useState("");

  // Company fields
  const [adminName, setAdminName] = useState("");
  const [adminLastName, setAdminLastName] = useState("");
  const [companyNif, setCompanyNif] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyTradeName, setCompanyTradeName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyNationality, setCompanyNationality] = useState("ES");
  const [companyPassword, setCompanyPassword] = useState("");
  const [companyConfirmPassword, setCompanyConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [companyEmailError, setCompanyEmailError] = useState<string | null>(
    null
  );
  const [companyNifError, setCompanyNifError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations("auth.register");

  const handleTypeChange = (type: RegisterType) => {
    setRegisterType(type);
    setCompanyStep(1);
    setError("");
    setEmailError(null);
    setCompanyEmailError(null);
    setCompanyNifError(null);
  };

  const checkEmailAvailability = async (
    emailVal: string,
    type: "worker" | "company"
  ) => {
    if (!emailVal || !emailVal.includes("@")) return;
    try {
      const res = await fetch(
        `/api/auth/check-email?email=${encodeURIComponent(emailVal)}`
      );
      const data = await res.json();
      const msg = data.exists ? t("errors.emailAlreadyRegistered") : null;
      if (type === "worker") setEmailError(msg);
      else setCompanyEmailError(msg);
    } catch {
      // If the check fails, let signup handle it
    }
  };

  const checkNifAvailability = async (nifVal: string) => {
    if (!nifVal.trim()) return;
    try {
      const res = await fetch(
        `/api/auth/check-nif?nif=${encodeURIComponent(nifVal.trim())}`
      );
      const data = await res.json();
      setCompanyNifError(data.exists ? t("errors.nifAlreadyRegistered") : null);
    } catch {
      // If the check fails, let registration handle it
    }
  };

  const doRegister = async () => {
    setError("");

    // Block if there is a known duplicate email or NIF
    if (registerType === "worker" && emailError) return;
    if (registerType === "company" && companyEmailError) return;
    if (registerType === "company" && companyNifError) return;

    setLoading(true);

    try {
      // Validate invitation code before creating the worker account
      if (registerType === "worker") {
        if (password !== confirmPassword) {
          setError(t("errors.passwordMismatch"));
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError(t("errors.passwordTooShort"));
          setLoading(false);
          return;
        }
        const validateRes = await fetch(
          `/api/invitation-codes/validate?code=${encodeURIComponent(companyCode)}`
        );
        const validateData = await validateRes.json();
        if (!validateData.valid) {
          setError(validateData.error ?? t("errors.invalidInvitationCode"));
          setLoading(false);
          return;
        }
      }

      // Build registration metadata — stored in auth.users and consumed on email confirmation
      const metadata =
        registerType === "worker"
          ? {
              registration_type: "worker",
              name,
              last_name: lastName,
              phone,
              dni,
              invitation_code: companyCode,
            }
          : {
              registration_type: "company",
              admin_name: adminName,
              admin_last_name: adminLastName,
              nif: companyNif,
              company_name: companyName,
              business_name: companyTradeName,
              address: companyAddress,
              company_email: companyEmail,
              nationality: companyNationality,
              selected_plan: selectedPlan,
            };

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: registerType === "worker" ? email : companyEmail,
        password: registerType === "worker" ? password : companyPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
          data: metadata,
        },
      });

      if (signUpError) {
        const msg =
          signUpError.message === "User already registered"
            ? t("errors.emailAlreadyRegistered")
            : signUpError.message;
        setError(msg);
        setLoading(false);
        return;
      }

      // Email confirmation required
      if (data.user && !data.session) {
        setSuccess(true);
        setLoading(false);
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError(t("errors.generic"));
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Step 1 for company: validate and advance to plan selection
    if (registerType === "company" && companyStep === 1) {
      if (companyNifError) return;
      if (companyEmailError) return;
      if (companyPassword !== companyConfirmPassword) {
        setError(t("errors.passwordMismatch"));
        return;
      }
      if (companyPassword.length < 6) {
        setError(t("errors.passwordTooShort"));
        return;
      }
      setCompanyStep(2);
      return;
    }

    await doRegister();
  };

  if (success) {
    return (
      <div className="flex flex-1 flex-col justify-center">
        <div className="mx-auto w-full max-w-md px-5 py-12">
          <Card className="p-6 text-center sm:p-8">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-live-soft text-live-text">
              <Check className="size-8" aria-hidden="true" />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight">
              {t("success.title")}
            </h1>
            <p className="mt-3 break-words text-muted-foreground">
              {t.rich("success.message", {
                email: registerType === "worker" ? email : companyEmail,
                strong: (chunks) => (
                  <strong className="font-semibold text-foreground">
                    {chunks}
                  </strong>
                ),
              })}
            </p>
            <Button asChild variant="brand" size="lg" className="mt-8 w-full">
              <Link href="/auth/login">{t("success.goToLogin")}</Link>
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-5 py-12">
        <div className="text-center">
          <JornifyLogo size="lg" />
          <h1 className="mt-8 text-3xl font-semibold tracking-tight">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Card className="mt-8 p-6 sm:p-8">
          {/* Register type selector — only show on step 1 */}
          {(registerType === "worker" || companyStep === 1) && (
            <div className="mb-6 flex gap-1 rounded-full bg-secondary p-1">
              <button
                type="button"
                onClick={() => handleTypeChange("worker")}
                aria-pressed={registerType === "worker"}
                className={cn(
                  segmentClass,
                  registerType === "worker"
                    ? segmentActiveClass
                    : segmentInactiveClass
                )}
              >
                {t("worker")}
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange("company")}
                aria-pressed={registerType === "company"}
                className={cn(
                  segmentClass,
                  registerType === "company"
                    ? segmentActiveClass
                    : segmentInactiveClass
                )}
              >
                {t("company")}
              </button>
            </div>
          )}

          {/* Plan selection step (company step 2) */}
          {registerType === "company" && companyStep === 2 ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">
                  {t("planSelection.title")}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("planSelection.subtitle")}
                </p>
              </div>

              {error && <Alert variant="error">{error}</Alert>}

              <div className="space-y-3">
                {ALL_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    aria-pressed={selectedPlan === plan.id}
                    className={cn(
                      "w-full rounded-xl border p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      selectedPlan === plan.id
                        ? "border-transparent bg-brand-soft ring-2 ring-ring"
                        : "bg-card hover:bg-accent"
                    )}
                  >
                    {/* Plan header */}
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="text-lg font-semibold">
                          {plan.name}
                        </span>
                        <StatusBadge
                          tone="neutral"
                          size="sm"
                          dot={false}
                          className="tabular-nums"
                        >
                          {plan.priceMonthly === 0
                            ? t("planSelection.free")
                            : `${(plan.priceMonthly / 100).toFixed(0)}${t("planSelection.perMonth")}`}
                        </StatusBadge>
                      </div>
                      <div
                        aria-hidden="true"
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                          selectedPlan === plan.id
                            ? "border-brand bg-brand text-brand-foreground"
                            : "border-border-strong"
                        )}
                      >
                        {selectedPlan === plan.id && (
                          <Check className="size-3" />
                        )}
                      </div>
                    </div>

                    <p className="mb-4 text-sm text-muted-foreground">
                      {plan.description}
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-1 gap-1.5">
                      {plan.enabledFeatures.map((feature) => (
                        <div
                          key={feature}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle2
                            className="size-4 shrink-0 text-live-text"
                            aria-hidden="true"
                          />
                          <span>{t(`planSelection.features.${feature}`)}</span>
                        </div>
                      ))}
                      {plan.allowedDayTypes.map((dt) => (
                        <div
                          key={dt}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle2
                            className="size-4 shrink-0 text-live-text"
                            aria-hidden="true"
                          />
                          <span>{t(`planSelection.dayTypes.${dt}`)}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant="brand"
                  size="lg"
                  className="w-full"
                  onClick={doRegister}
                  disabled={loading}
                >
                  {loading ? t("submitting") : t("submit")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setCompanyStep(1)}
                  disabled={loading}
                >
                  <ArrowLeft />
                  {t("planSelection.back")}
                </Button>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                {t("hasAccount")}{" "}
                <Link href="/auth/login" className={linkClass}>
                  {t("loginHere")}
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && <Alert variant="error">{error}</Alert>}

              {/* Worker registration fields */}
              {registerType === "worker" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("name")}</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder={t("namePlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t("lastName")}</Label>
                    <Input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      placeholder={t("lastNamePlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dni">{t("dni")}</Label>
                    <Input
                      id="dni"
                      type="text"
                      value={dni}
                      onChange={(e) => setDni(e.target.value)}
                      required
                      placeholder={t("dniPlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("phone")}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder={t("phonePlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">{t("email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError(null);
                      }}
                      onBlur={() => checkEmailAvailability(email, "worker")}
                      required
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? "email-error" : undefined}
                      className={emailError ? invalidInputClass : undefined}
                      placeholder={t("emailPlaceholder")}
                    />
                    {emailError && (
                      <p
                        id="email-error"
                        role="alert"
                        className="text-sm text-alert-text"
                      >
                        {emailError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">{t("password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder={t("passwordPlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      {t("confirmPassword")}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder={t("confirmPasswordPlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyCode">{t("companyCode")}</Label>
                    <Input
                      id="companyCode"
                      type="text"
                      value={companyCode}
                      onChange={(e) =>
                        setCompanyCode(e.target.value.toUpperCase())
                      }
                      required
                      placeholder={t("companyCodePlaceholder")}
                    />
                  </div>
                </>
              )}

              {/* Company registration fields (step 1) */}
              {registerType === "company" && (
                <>
                  <p className={sectionLabelClass}>{t("responsibleSection")}</p>

                  <div className="space-y-2">
                    <Label htmlFor="adminName">{t("adminName")}</Label>
                    <Input
                      id="adminName"
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      required
                      placeholder={t("namePlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="adminLastName">{t("adminLastName")}</Label>
                    <Input
                      id="adminLastName"
                      type="text"
                      value={adminLastName}
                      onChange={(e) => setAdminLastName(e.target.value)}
                      required
                      placeholder={t("lastNamePlaceholder")}
                    />
                  </div>

                  <p className={cn(sectionLabelClass, "pt-3")}>
                    {t("companyDataSection")}
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="companyNif">{t("companyNif")}</Label>
                    <Input
                      id="companyNif"
                      type="text"
                      value={companyNif}
                      onChange={(e) => {
                        setCompanyNif(e.target.value);
                        setCompanyNifError(null);
                      }}
                      onBlur={() => checkNifAvailability(companyNif)}
                      required
                      aria-invalid={!!companyNifError}
                      aria-describedby={
                        companyNifError ? "companyNif-error" : undefined
                      }
                      className={
                        companyNifError ? invalidInputClass : undefined
                      }
                      placeholder={t("companyNifPlaceholder")}
                    />
                    {companyNifError && (
                      <p
                        id="companyNif-error"
                        role="alert"
                        className="text-sm text-alert-text"
                      >
                        {companyNifError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyName">{t("companyName")}</Label>
                    <Input
                      id="companyName"
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                      placeholder={t("companyNamePlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyTradeName">
                      {t("companyTradeName")}
                    </Label>
                    <Input
                      id="companyTradeName"
                      type="text"
                      value={companyTradeName}
                      onChange={(e) => setCompanyTradeName(e.target.value)}
                      required
                      placeholder={t("companyTradeNamePlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">{t("companyEmail")}</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={companyEmail}
                      onChange={(e) => {
                        setCompanyEmail(e.target.value);
                        setCompanyEmailError(null);
                      }}
                      onBlur={() =>
                        checkEmailAvailability(companyEmail, "company")
                      }
                      required
                      aria-invalid={!!companyEmailError}
                      aria-describedby={
                        companyEmailError ? "companyEmail-error" : undefined
                      }
                      className={
                        companyEmailError ? invalidInputClass : undefined
                      }
                      placeholder={t("companyEmailPlaceholder")}
                    />
                    {companyEmailError && (
                      <p
                        id="companyEmail-error"
                        role="alert"
                        className="text-sm text-alert-text"
                      >
                        {companyEmailError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyAddress">
                      {t("companyAddress")}
                    </Label>
                    <Input
                      id="companyAddress"
                      type="text"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      required
                      placeholder={t("companyAddressPlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyNationality">{t("country")}</Label>
                    <NativeSelect
                      id="companyNationality"
                      value={companyNationality}
                      onChange={(e) => setCompanyNationality(e.target.value)}
                    >
                      {ALL_COUNTRIES.map((c) => (
                        <option key={c.isoCode} value={c.isoCode}>
                          {c.name}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyPassword">{t("password")}</Label>
                    <Input
                      id="companyPassword"
                      type="password"
                      value={companyPassword}
                      onChange={(e) => setCompanyPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder={t("passwordPlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companyConfirmPassword">
                      {t("confirmPassword")}
                    </Label>
                    <Input
                      id="companyConfirmPassword"
                      type="password"
                      value={companyConfirmPassword}
                      onChange={(e) =>
                        setCompanyConfirmPassword(e.target.value)
                      }
                      required
                      minLength={6}
                      placeholder={t("confirmPasswordPlaceholder")}
                    />
                  </div>
                </>
              )}

              <Button
                type="submit"
                variant="brand"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading
                  ? t("processing")
                  : registerType === "company"
                    ? t("continueButton")
                    : t("submit")}
              </Button>
            </form>
          )}

          {/* Login link — only shown in form step, not plan step (plan step has its own) */}
          {!(registerType === "company" && companyStep === 2) && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {t("hasAccount")}{" "}
              <Link href="/auth/login" className={linkClass}>
                {t("loginHere")}
              </Link>
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
