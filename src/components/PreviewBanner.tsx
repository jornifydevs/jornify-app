import { getTranslations } from "next-intl/server";
import { TriangleAlert } from "lucide-react";

export async function PreviewBanner() {
  if (process.env.VERCEL_ENV !== "preview") return null;

  const t = await getTranslations("common");

  return (
    <div className="flex w-full items-center justify-center gap-2 border-b bg-brand-soft px-4 py-1.5 text-center text-sm font-semibold text-brand-text">
      <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
      {t("previewBanner")}
    </div>
  );
}
