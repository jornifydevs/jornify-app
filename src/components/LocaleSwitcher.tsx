"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLocale } from "@/app/actions/locale";

const locales = [
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "en", label: "English", flag: "🇬🇧" },
] as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentLocale = locales.find((l) => l.code === locale) ?? locales[0];

  function handleLocaleChange(newLocale: string) {
    startTransition(async () => {
      await setLocale(newLocale);
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-400 hover:text-white rounded-lg transition-colors disabled:opacity-50"
          aria-label="Cambiar idioma"
          disabled={isPending}
        >
          <span className="text-base">{currentLocale.flag}</span>
          <span>{currentLocale.label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="w-36 bg-slate-800 border-slate-700"
      >
        {locales.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => handleLocaleChange(l.code)}
            className={`flex items-center gap-2 cursor-pointer focus:bg-slate-700 focus:text-white ${
              locale === l.code ? "text-white font-medium" : "text-slate-400"
            }`}
          >
            <span className="text-base">{l.flag}</span>
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
