"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export function AppFooter() {
  const t = useTranslations("dashboard.footer");
  const pathname = usePathname();
  const year = new Date().getFullYear();

  // The dashboard shells carry their own language and theme controls.
  if (pathname.startsWith("/dashboard")) return null;

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-6 py-6 text-center">
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link
            href="/privacy-policy"
            className="transition-colors hover:text-foreground"
          >
            {t("privacyPolicy")}
          </Link>
          <Link href="/tos" className="transition-colors hover:text-foreground">
            {t("termsAndConditions")}
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <p className="text-sm text-muted-foreground">
            {t("copyright", { year })}
          </p>
          <LocaleSwitcher />
          <ThemeSwitcher />
        </div>
      </div>
    </footer>
  );
}
