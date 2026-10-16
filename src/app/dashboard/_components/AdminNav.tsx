"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  Building2,
  CalendarClock,
  CreditCard,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  Menu,
  SunMoon,
  Ticket,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemeToggle } from "@/hooks/useThemeToggle";
import { useLocaleSwitch } from "@/hooks/useLocaleSwitch";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", key: "today", icon: LayoutDashboard },
  { href: "/dashboard/admin/workers", key: "team", icon: Users },
  { href: "/dashboard/admin/centers", key: "centers", icon: Building2 },
  { href: "/dashboard/admin/schedule", key: "shifts", icon: CalendarClock },
  { href: "/dashboard/admin/reports", key: "reports", icon: FileBarChart },
  {
    href: "/dashboard/admin/invitation-codes",
    key: "invitations",
    icon: Ticket,
  },
  { href: "/dashboard/admin/company", key: "company", icon: Briefcase },
  { href: "/dashboard/admin/billing", key: "billing", icon: CreditCard },
] as const;

function useActiveHref() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export function AdminNav() {
  const t = useTranslations("dashboard.admin.nav");
  const isActive = useActiveHref();

  return (
    <nav aria-label={t("label")} className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <item.icon className="size-[18px]" aria-hidden="true" />
            {t(item.key)}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminMobileMenu() {
  const t = useTranslations("dashboard.admin.nav");
  const tc = useTranslations("common");
  const isActive = useActiveHref();
  const { toggleTheme, isPending } = useThemeToggle();
  const { locale, locales, changeLocale } = useLocaleSwitch();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("menu")}
        className="flex size-11 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-track focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Menu className="size-5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-xl p-1.5">
        {NAV_ITEMS.map((item) => (
          <DropdownMenuItem
            key={item.href}
            asChild
            className={cn(
              "min-h-11 rounded-md",
              isActive(item.href) && "bg-accent font-semibold"
            )}
          >
            <Link
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className="cursor-pointer"
            >
              <item.icon />
              {t(item.key)}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="min-h-11 rounded-md"
          disabled={isPending}
          onSelect={toggleTheme}
        >
          <SunMoon />
          {tc("toggleTheme")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          {tc("language")}
        </DropdownMenuLabel>
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
        <DropdownMenuSeparator />
        <DropdownMenuItem
          asChild
          className="min-h-11 rounded-md text-alert-text focus:bg-alert-soft focus:text-alert-text"
        >
          <form action="/auth/signout" method="post" className="w-full">
            <button type="submit" className="flex w-full items-center gap-2">
              <LogOut className="size-4" />
              {tc("signOut")}
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
