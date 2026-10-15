import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

const locales = ["es", "en"] as const;
type Locale = (typeof locales)[number];
const defaultLocale: Locale = "es";

const messageImports = {
  es: () => import("../../messages/es.json"),
  en: () => import("../../messages/en.json"),
} as const;

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;

  const locale: Locale =
    cookieLocale && locales.includes(cookieLocale as Locale)
      ? (cookieLocale as Locale)
      : defaultLocale;

  return {
    locale,
    messages: (await messageImports[locale]()).default,
  };
});
