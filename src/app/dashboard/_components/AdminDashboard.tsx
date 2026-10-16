"use client";

import Link from "next/link";
import {
  Users,
  Building2,
  FileBarChart,
  ChevronRight,
  Briefcase,
  CalendarClock,
  CreditCard,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/PageHeader";

interface AdminDashboardProps {
  userName: string;
  userLastName: string;
  totalWorkers: number;
  totalCenters: number;
  activeToday: number;
}

export default function AdminDashboard({
  userName,
  userLastName,
  totalWorkers,
  totalCenters,
  activeToday,
}: AdminDashboardProps) {
  const t = useTranslations("dashboard.admin");

  const adminSections = [
    {
      title: t("workerManagement"),
      description: t("workerManagementDesc"),
      href: "/dashboard/admin/workers",
      icon: Users,
    },
    {
      title: t("centerManagement"),
      description: t("centerManagementDesc"),
      href: "/dashboard/admin/centers",
      icon: Building2,
    },
    {
      title: t("reports.title"),
      description: t("reports.subtitle"),
      href: "/dashboard/admin/reports",
      icon: FileBarChart,
    },
    {
      title: t("companyManagement"),
      description: t("companyManagementDesc"),
      href: "/dashboard/admin/company",
      icon: Briefcase,
    },
    {
      title: t("scheduleManagement"),
      description: t("scheduleManagementDesc"),
      href: "/dashboard/admin/schedule",
      icon: CalendarClock,
    },
    {
      title: t("billingManagement"),
      description: t("billingManagementDesc"),
      href: "/dashboard/admin/billing",
      icon: CreditCard,
    },
  ];

  const stats = [
    { label: t("totalWorkers"), value: totalWorkers, live: false },
    { label: t("workCenters"), value: totalCenters, live: false },
    { label: t("activeToday"), value: activeToday, live: true },
  ];

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 pt-6 lg:pt-8">
        <PageHeader
          title={t("title")}
          description={
            <>
              {userName} {userLastName}
            </>
          }
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 flex-1">
        <div className="space-y-8">
          {/* Welcome Message */}
          <section>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("welcome", { name: userName })}
            </h2>
            <p className="mt-1 text-muted-foreground">{t("welcomeMessage")}</p>
          </section>

          {/* Statistics Cards */}
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border bg-card p-5 shadow-sm"
              >
                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                  {stat.live && (
                    <span
                      aria-hidden="true"
                      className="size-2 shrink-0 rounded-full bg-live"
                    />
                  )}
                  {stat.label}
                </dt>
                <dd className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>

          {/* Admin Sections Navigation */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {adminSections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className="group flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-track">
                  <section.icon className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{section.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </div>
                <ChevronRight
                  className="mt-2.5 size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
