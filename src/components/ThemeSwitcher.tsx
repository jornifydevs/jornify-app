"use client";

import { useTranslations } from "next-intl";
import { Sun, Moon } from "lucide-react";
import { useThemeToggle } from "@/hooks/useThemeToggle";

export function ThemeSwitcher() {
  const tc = useTranslations("common");
  const { toggleTheme, isPending } = useThemeToggle();

  return (
    <button
      onClick={toggleTheme}
      disabled={isPending}
      aria-label={tc("toggleTheme")}
      className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
    >
      <Sun className="hidden size-[18px] dark:block" aria-hidden="true" />
      <Moon className="size-[18px] dark:hidden" aria-hidden="true" />
    </button>
  );
}
