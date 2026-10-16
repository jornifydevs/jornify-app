"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Country } from "country-state-city";
import { createClient } from "@/infrastructure/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JornifyLogo } from "@/components/JornifyLogo";
import { Clock, Check, CheckCircle2, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { ALL_PLANS } from "@/core/domain/entities";
import type { PlanId } from "@/core/domain/entities";

const ALL_COUNTRIES = Country.getAllCountries().sort((a, b) =>
  a.name.localeCompare(b.name)
);

type RegisterType = "worker" | "company";

const inputClass =
  "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-900/50 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500";

const FEATURE_LABELS: Record<string, string> = {
  profile: "Perfil de empleado",
  payroll: "Gestión de nóminas",
  vacation: "Control de vacaciones",
  calendar: "Calendario laboral",
  break: "Control de descansos",
};

const DAY_TYPE_LABELS: Record<string, string> = {
  normal: "Días laborales normales",
  holiday: "Festivos",
  vacation: "Vacaciones",
  sick_leave: "Baja médica",
};

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
      <div className="flex flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm px-8 py-10 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-green-600 rounded-2xl">
                  <Clock className="w-12 h-12 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                {t("success.title")}
              </h2>
              <p className="text-slate-700 dark:text-slate-300 mb-6">
                {t.rich("success.message", {
                  email: registerType === "worker" ? email : companyEmail,
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </p>
              <Link
                href="/auth/login"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                {t("success.goToLogin")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-6">
            <JornifyLogo size="lg" />
          </div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t("title")}
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            {t("subtitle")}
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm px-8 py-10 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-700">
            {/* Register type selector — only show on step 1 */}
            {(registerType === "worker" || companyStep === 1) && (
              <div className="flex gap-2 mb-6">
                <Button
                  type="button"
                  onClick={() => handleTypeChange("worker")}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    registerType === "worker"
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300"
                  }`}
                >
                  {t("worker")}
                </Button>
                <Button
                  type="button"
                  onClick={() => handleTypeChange("company")}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-200 ${
                    registerType === "company"
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                      : "bg-slate-200 hover:bg-slate-300 text-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300"
                  }`}
                >
                  {t("company")}
                </Button>
              </div>
            )}

            {/* Plan selection step (company step 2) */}
            {registerType === "company" && companyStep === 2 ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t("planSelection.title")}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {t("planSelection.subtitle")}
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {ALL_PLANS.map((plan) => (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 ${
                        selectedPlan === plan.id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-slate-200 bg-white/50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-slate-500"
                      }`}
                    >
                      {/* Plan header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-slate-900 dark:text-white">
                            {plan.name}
                          </span>
                          <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                            {plan.priceMonthly === 0
                              ? t("planSelection.free")
                              : `${(plan.priceMonthly / 100).toFixed(0)}${t("planSelection.perMonth")}`}
                          </span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedPlan === plan.id
                              ? "border-blue-500 bg-blue-500"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {selectedPlan === plan.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        {plan.description}
                      </p>

                      {/* Features */}
                      <div className="grid grid-cols-1 gap-1.5">
                        {plan.enabledFeatures.map((feature) => (
                          <div
                            key={feature}
                            className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span>{FEATURE_LABELS[feature] ?? feature}</span>
                          </div>
                        ))}
                        {plan.allowedDayTypes.map((dt) => (
                          <div
                            key={dt}
                            className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"
                          >
                            <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <span>{DAY_TYPE_LABELS[dt] ?? dt}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={() => setCompanyStep(1)}
                    disabled={loading}
                    className="flex-1 py-5 rounded-xl font-semibold bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {t("planSelection.back")}
                  </Button>
                  <Button
                    type="button"
                    onClick={doRegister}
                    disabled={loading}
                    className="flex-1 py-5 rounded-xl font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30"
                  >
                    {loading ? t("submitting") : t("submit")}
                  </Button>
                </div>

                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  {t("hasAccount")}{" "}
                  <Link
                    href="/auth/login"
                    className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    {t("loginHere")}
                  </Link>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Worker registration fields */}
                {registerType === "worker" && (
                  <>
                    <div className="space-y-2">
                      <Label
                        htmlFor="name"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("name")}
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className={inputClass}
                        placeholder={t("namePlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="lastName"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("lastName")}
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        className={inputClass}
                        placeholder={t("lastNamePlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="dni"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("dni")}
                      </Label>
                      <Input
                        id="dni"
                        type="text"
                        value={dni}
                        onChange={(e) => setDni(e.target.value)}
                        required
                        className={inputClass}
                        placeholder={t("dniPlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="phone"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("phone")}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className={inputClass}
                        placeholder={t("phonePlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="email"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("email")}
                      </Label>
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
                        className={`${inputClass} ${emailError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                        placeholder={t("emailPlaceholder")}
                      />
                      {emailError && (
                        <p className="text-xs text-red-400">{emailError}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="password"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("password")}
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className={inputClass}
                        placeholder={t("passwordPlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="confirmPassword"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("confirmPassword")}
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className={inputClass}
                        placeholder={t("confirmPasswordPlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="companyCode"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("companyCode")}
                      </Label>
                      <Input
                        id="companyCode"
                        type="text"
                        value={companyCode}
                        onChange={(e) =>
                          setCompanyCode(e.target.value.toUpperCase())
                        }
                        required
                        className={inputClass}
                        placeholder={t("companyCodePlaceholder")}
                      />
                    </div>
                  </>
                )}

                {/* Company registration fields (step 1) */}
                {registerType === "company" && (
                  <>
                    <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                        {t("responsibleSection")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="adminName"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("adminName")}
                      </Label>
                      <Input
                        id="adminName"
                        type="text"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                        required
                        className={inputClass}
                        placeholder={t("namePlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="adminLastName"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("adminLastName")}
                      </Label>
                      <Input
                        id="adminLastName"
                        type="text"
                        value={adminLastName}
                        onChange={(e) => setAdminLastName(e.target.value)}
                        required
                        className={inputClass}
                        placeholder={t("lastNamePlaceholder")}
                      />
                    </div>

                    <div className="pb-2 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                        {t("companyDataSection")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="companyNif"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("companyNif")}
                      </Label>
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
                        className={`${inputClass} ${companyNifError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                        placeholder={t("companyNifPlaceholder")}
                      />
                      {companyNifError && (
                        <p className="text-xs text-red-400">
                          {companyNifError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="companyName"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("companyName")}
                      </Label>
                      <Input
                        id="companyName"
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className={inputClass}
                        placeholder={t("companyNamePlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="companyTradeName"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("companyTradeName")}
                      </Label>
                      <Input
                        id="companyTradeName"
                        type="text"
                        value={companyTradeName}
                        onChange={(e) => setCompanyTradeName(e.target.value)}
                        required
                        className={inputClass}
                        placeholder={t("companyTradeNamePlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="companyEmail"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("companyEmail")}
                      </Label>
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
                        className={`${inputClass} ${companyEmailError ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`}
                        placeholder={t("companyEmailPlaceholder")}
                      />
                      {companyEmailError && (
                        <p className="text-xs text-red-400">
                          {companyEmailError}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="companyAddress"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("companyAddress")}
                      </Label>
                      <Input
                        id="companyAddress"
                        type="text"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        required
                        className={inputClass}
                        placeholder={t("companyAddressPlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="companyNationality"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("country")}
                      </Label>
                      <select
                        id="companyNationality"
                        value={companyNationality}
                        onChange={(e) => setCompanyNationality(e.target.value)}
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-900/50 dark:text-white dark:[&>option]:bg-slate-800"
                      >
                        {ALL_COUNTRIES.map((c) => (
                          <option key={c.isoCode} value={c.isoCode}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="companyPassword"
                        className="text-slate-800 dark:text-slate-200"
                      >
                        {t("password")}
                      </Label>
                      <Input
                        id="companyPassword"
                        type="password"
                        value={companyPassword}
                        onChange={(e) => setCompanyPassword(e.target.value)}
                        required
                        minLength={6}
                        className={inputClass}
                        placeholder={t("passwordPlaceholder")}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="companyConfirmPassword"
                        className="text-slate-800 dark:text-slate-200"
                      >
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
                        className={inputClass}
                        placeholder={t("confirmPasswordPlaceholder")}
                      />
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200"
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
              <p className="text-center text-sm pt-6 text-slate-400">
                {t("hasAccount")}{" "}
                <Link
                  href="/auth/login"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  {t("loginHere")}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
