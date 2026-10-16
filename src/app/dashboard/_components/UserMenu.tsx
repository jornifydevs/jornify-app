"use client";

import { Fragment } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  User,
  FileText,
  CalendarDays,
  Calendar,
  CalendarClock,
  LogOut,
  History,
} from "lucide-react";
import type { CenterFeature } from "@/core/domain/entities";
import { CENTER_FEATURES } from "@/core/domain/entities";
import { useTranslations } from "next-intl";

interface UserMenuProps {
  enabledFeatures: CenterFeature[];
}

export default function UserMenu({ enabledFeatures }: UserMenuProps) {
  const t = useTranslations("dashboard.userMenu");
  const tc = useTranslations("common");

  const MENU_ITEMS = [
    {
      key: CENTER_FEATURES.PROFILE,
      label: t("profile"),
      href: "/dashboard/profile",
      icon: User,
    },
    {
      key: CENTER_FEATURES.PAYROLL,
      label: t("payroll"),
      href: "/dashboard/payroll",
      icon: FileText,
    },
    {
      key: CENTER_FEATURES.VACATION,
      label: t("availability"),
      href: "/dashboard/availability",
      icon: CalendarDays,
    },
    {
      key: CENTER_FEATURES.CALENDAR,
      label: t("calendar"),
      href: "/dashboard/calendar",
      icon: Calendar,
    },
    {
      key: CENTER_FEATURES.SCHEDULE,
      label: t("schedule"),
      href: "/dashboard/schedule",
      icon: CalendarClock,
    },
  ];

  const visibleItems = MENU_ITEMS.filter((item) =>
    enabledFeatures.includes(item.key)
  );

  const hasProfile = enabledFeatures.includes(CENTER_FEATURES.PROFILE);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-track focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={t("menuLabel")}
        >
          <Menu className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl p-1.5">
        {visibleItems.map((item) => (
          <Fragment key={item.key}>
            <DropdownMenuItem asChild className="min-h-11 rounded-md">
              <Link href={item.href} className="cursor-pointer">
                <item.icon />
                {item.label}
              </Link>
            </DropdownMenuItem>
            {item.key === CENTER_FEATURES.PROFILE && (
              <DropdownMenuItem asChild className="min-h-11 rounded-md">
                <Link href="/dashboard/history" className="cursor-pointer">
                  <History />
                  {t("history")}
                </Link>
              </DropdownMenuItem>
            )}
          </Fragment>
        ))}

        {!hasProfile && (
          <DropdownMenuItem asChild className="min-h-11 rounded-md">
            <Link href="/dashboard/history" className="cursor-pointer">
              <History />
              {t("history")}
            </Link>
          </DropdownMenuItem>
        )}

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
