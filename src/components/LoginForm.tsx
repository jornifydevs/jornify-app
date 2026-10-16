"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/infrastructure/supabase/client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
          <form onSubmit={handleLogin} className="space-y-5">
            {expired && <Alert variant="warning">{t("sessionExpired")}</Alert>}

            {error && <Alert variant="error">{error}</Alert>}

            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t("emailPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? t("submitting") : t("submit")}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {t("noAccount")}{" "}
            <Link
              href="/auth/register"
              className="inline-flex min-h-11 items-center rounded-sm font-medium text-brand-text underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {t("register")}
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
