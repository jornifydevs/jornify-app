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
          className="flex items-center justify-center w-10 h-10 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
          aria-label={t("menuLabel")}
        >
          <Menu className="w-5 h-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700"
      >
        {visibleItems.map((item) => (
          <Fragment key={item.key}>
            <DropdownMenuItem
              asChild
              className="focus:bg-slate-200 focus:text-slate-900 dark:focus:bg-slate-700 dark:focus:text-white"
            >
              <Link
                href={item.href}
                className="flex items-center gap-2 text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white cursor-pointer"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            </DropdownMenuItem>
            {item.key === CENTER_FEATURES.PROFILE && (
              <DropdownMenuItem
                asChild
                className="focus:bg-slate-200 focus:text-slate-900 dark:focus:bg-slate-700 dark:focus:text-white"
              >
                <Link
                  href="/dashboard/history"
                  className="flex items-center gap-2 text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white cursor-pointer"
                >
                  <History className="w-4 h-4" />
                  {t("history")}
                </Link>
              </DropdownMenuItem>
            )}
          </Fragment>
        ))}

        {!hasProfile && (
          <DropdownMenuItem
            asChild
            className="focus:bg-slate-200 focus:text-slate-900 dark:focus:bg-slate-700 dark:focus:text-white"
          >
            <Link
              href="/dashboard/history"
              className="flex items-center gap-2 text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white cursor-pointer"
            >
              <History className="w-4 h-4" />
              {t("history")}
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />

        <DropdownMenuItem
          asChild
          className="focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-500/10 dark:focus:text-red-400"
        >
          <form action="/auth/signout" method="post" className="w-full">
            <button
              type="submit"
              className="flex items-center gap-2 w-full text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
            >
              <LogOut className="w-4 h-4" />
              {tc("signOut")}
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
