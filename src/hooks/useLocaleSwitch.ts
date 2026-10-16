"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { setLocale } from "@/app/actions/locale";

export const LOCALES = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
] as const;

export function useLocaleSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function changeLocale(code: string) {
    startTransition(async () => {
      await setLocale(code);
      router.refresh();
    });
  }

  return { locale, locales: LOCALES, changeLocale, isPending };
}
