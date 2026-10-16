"use client";

import { useTranslations } from "next-intl";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocaleSwitch } from "@/hooks/useLocaleSwitch";

export function LocaleSwitcher() {
  const tc = useTranslations("common");
  const { locale, locales, changeLocale, isPending } = useLocaleSwitch();
  const current = locales.find((l) => l.code === locale) ?? locales[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={tc("language")}
        disabled={isPending}
        className="flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        <Languages className="size-[18px]" aria-hidden="true" />
        {current.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-40 rounded-xl p-1.5">
        <DropdownMenuRadioGroup value={locale} onValueChange={changeLocale}>
          {locales.map((l) => (
            <DropdownMenuRadioItem
              key={l.code}
              value={l.code}
              className="min-h-11 rounded-md"
            >
              {l.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
