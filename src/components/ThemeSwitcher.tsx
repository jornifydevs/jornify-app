"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sun, Moon } from "lucide-react";
import { setTheme } from "@/app/actions/theme";

interface ThemeSwitcherProps {
  theme: "dark" | "light";
}

export function ThemeSwitcher({ theme }: ThemeSwitcherProps) {
  const t = useTranslations("dashboard.footer");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    const next = theme === "dark" ? "light" : "dark";
    startTransition(async () => {
      await setTheme(next);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      aria-label={theme === "dark" ? t("switchToLight") : t("switchToDark")}
      className="flex items-center justify-center w-11 h-11 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors disabled:opacity-50"
    >
      {theme === "dark" ? (
        <Sun className="w-4 h-4" />
      ) : (
        <Moon className="w-4 h-4" />
      )}
    </button>
  );
}
