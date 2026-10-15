"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

interface AppFooterProps {
  theme: "dark" | "light";
}

export function AppFooter({ theme }: AppFooterProps) {
  const t = useTranslations("dashboard.footer");
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-100 border-t border-slate-200 dark:bg-slate-900 dark:border-slate-700 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-6">
            <Link
              href="/privacy-policy"
              className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              {t("privacyPolicy")}
            </Link>
            <Link
              href="/tos"
              className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              {t("termsAndConditions")}
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t("copyright", { year })}
            </p>
            <LocaleSwitcher />
            <ThemeSwitcher theme={theme} />
          </div>
        </div>
      </div>
    </footer>
  );
}
