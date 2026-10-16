"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Calendar,
  CalendarClock,
  CalendarDays,
  FileText,
  History,
  House,
  LayoutGrid,
  LogOut,
  SunMoon,
  User,
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
import { CENTER_FEATURES } from "@/core/domain/entities";
import type { CenterFeature } from "@/core/domain/entities";
import { useThemeToggle } from "@/hooks/useThemeToggle";
import { useLocaleSwitch } from "@/hooks/useLocaleSwitch";
import { cn } from "@/lib/utils";

interface WorkerTabBarProps {
  enabledFeatures: CenterFeature[];
}

const tabClassName = (active: boolean) =>
  cn(
    "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-1 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    active
      ? "bg-foreground/[0.08] font-semibold text-foreground"
      : "text-muted-foreground hover:text-foreground"
  );

export function WorkerTabBar({ enabledFeatures }: WorkerTabBarProps) {
  const pathname = usePathname();
  const t = useTranslations("dashboard.workerNav");
  const tm = useTranslations("dashboard.userMenu");
  const tc = useTranslations("common");
  const { toggleTheme, isPending: themePending } = useThemeToggle();
  const { locale, locales, changeLocale } = useLocaleSwitch();

  const has = (feature: CenterFeature) => enabledFeatures.includes(feature);
  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const tabs = [
    { href: "/dashboard", label: t("home"), icon: House, show: true },
    {
      href: "/dashboard/schedule",
      label: tm("schedule"),
      icon: CalendarClock,
      show: has(CENTER_FEATURES.SCHEDULE),
    },
    {
      href: "/dashboard/history",
      label: tm("history"),
      icon: History,
      show: true,
    },
    {
      href: "/dashboard/calendar",
      label: tm("calendar"),
      icon: Calendar,
      show: has(CENTER_FEATURES.CALENDAR),
    },
  ].filter((tab) => tab.show);

  const moreItems = [
    {
      href: "/dashboard/profile",
      label: tm("profile"),
      icon: User,
      show: has(CENTER_FEATURES.PROFILE),
    },
    {
      href: "/dashboard/payroll",
      label: tm("payroll"),
      icon: FileText,
      show: has(CENTER_FEATURES.PAYROLL),
    },
    {
      href: "/dashboard/availability",
      label: tm("availability"),
      icon: CalendarDays,
      show: has(CENTER_FEATURES.VACATION),
    },
  ].filter((item) => item.show);

  return (
    <nav
      aria-label={t("label")}
      className="fixed inset-x-3 bottom-4 z-40 mx-auto flex max-w-md gap-0.5 rounded-full border border-foreground/[0.08] bg-card/75 p-1.5 shadow-float backdrop-blur-xl backdrop-saturate-150"
    >
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          aria-current={isActive(tab.href) ? "page" : undefined}
          className={tabClassName(isActive(tab.href))}
        >
          <tab.icon className="size-[22px]" aria-hidden="true" />
          <span className="max-w-full truncate">{tab.label}</span>
        </Link>
      ))}

      <DropdownMenu>
        <DropdownMenuTrigger
          className={tabClassName(moreItems.some((i) => isActive(i.href)))}
        >
          <LayoutGrid className="size-[22px]" aria-hidden="true" />
          {t("more")}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="end"
          sideOffset={12}
          className="w-60 rounded-xl p-1.5"
        >
          {moreItems.map((item) => (
            <DropdownMenuItem
              key={item.href}
              asChild
              className="min-h-11 rounded-md"
            >
              <Link href={item.href} className="cursor-pointer">
                <item.icon />
                {item.label}
              </Link>
            </DropdownMenuItem>
          ))}
          {moreItems.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem
            className="min-h-11 rounded-md"
            disabled={themePending}
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
    </nav>
  );
}
