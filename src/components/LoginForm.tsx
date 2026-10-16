"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/infrastructure/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { JornifyLogo } from "@/components/JornifyLogo";
import { useTranslations } from "next-intl";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "inactivity";
  const supabase = createClient();
  const t = useTranslations("auth.login");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

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
            <form onSubmit={handleLogin} className="space-y-6">
              {expired && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/50 rounded-lg">
                  <p className="text-sm text-amber-400">
                    {t("sessionExpired")}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

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
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-900/50 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                  placeholder={t("emailPlaceholder")}
                />
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
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 dark:bg-slate-900/50 dark:border-slate-600 dark:text-white dark:placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-blue-500/30 transition-all duration-200"
                disabled={loading}
              >
                {loading ? t("submitting") : t("submit")}
              </Button>
            </form>

            <p className="text-center text-sm pt-6 text-slate-500 dark:text-slate-400">
              {t("noAccount")}{" "}
              <Link
                href="/auth/register"
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {t("register")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
