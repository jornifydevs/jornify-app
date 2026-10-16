import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";
import { JornifyLogo } from "@/components/JornifyLogo";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { AdminMobileMenu, AdminNav } from "./AdminNav";

interface AdminShellProps {
  companyName: string;
  userName: string;
  children: ReactNode;
}

function initialsOf(text: string) {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
}

export async function AdminShell({
  companyName,
  userName,
  children,
}: AdminShellProps) {
  const tc = await getTranslations("common");

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background/85 px-4 py-2 backdrop-blur-xl lg:hidden">
        <JornifyLogo />
        <AdminMobileMenu />
      </div>

      <aside className="hidden w-64 shrink-0 flex-col gap-6 border-r px-3.5 py-5 lg:sticky lg:top-0 lg:flex lg:h-screen">
        <div className="px-1.5">
          <JornifyLogo />
        </div>

        <div className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 shadow-sm">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-brand-soft text-xs font-bold text-brand-text"
          >
            {initialsOf(companyName)}
          </span>
          <p className="truncate text-sm font-semibold">{companyName}</p>
        </div>

        <AdminNav />

        <div className="mt-auto space-y-2 border-t pt-3">
          <div className="flex items-center gap-2.5 px-1.5">
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-track text-xs font-semibold"
            >
              {initialsOf(userName)}
            </span>
            <p className="min-w-0 flex-1 truncate text-sm font-medium">
              {userName}
            </p>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                aria-label={tc("signOut")}
                className="flex size-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-alert-soft hover:text-alert-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <LogOut className="size-[18px]" aria-hidden="true" />
              </button>
            </form>
          </div>
          <div className="flex items-center justify-between">
            <LocaleSwitcher />
            <ThemeSwitcher />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
