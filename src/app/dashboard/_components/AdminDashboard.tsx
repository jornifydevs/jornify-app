"use client";

import Link from "next/link";
import {
  LogOut,
  Users,
  Clock,
  Building2,
  FileBarChart,
  ChevronRight,
  Briefcase,
  CalendarClock,
  CreditCard,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface AdminDashboardProps {
  userName: string;
  userLastName: string;
  companyId: string;
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
  const tc = useTranslations("common");

  const adminSections = [
    {
      title: t("workerManagement"),
      description: t("workerManagementDesc"),
      href: "/dashboard/admin/workers",
      icon: Users,
      color: "bg-blue-600/20",
      iconColor: "text-blue-400",
      borderColor: "border-blue-500/30",
    },
    {
      title: t("centerManagement"),
      description: t("centerManagementDesc"),
      href: "/dashboard/admin/centers",
      icon: Building2,
      color: "bg-green-600/20",
      iconColor: "text-green-400",
      borderColor: "border-green-500/30",
    },
    {
      title: t("reports.title"),
      description: t("reports.subtitle"),
      href: "/dashboard/admin/reports",
      icon: FileBarChart,
      color: "bg-amber-600/20",
      iconColor: "text-amber-400",
      borderColor: "border-amber-500/30",
    },
    {
      title: t("companyManagement"),
      description: t("companyManagementDesc"),
      href: "/dashboard/admin/company",
      icon: Briefcase,
      color: "bg-purple-600/20",
      iconColor: "text-purple-400",
      borderColor: "border-purple-500/30",
    },
    {
      title: t("scheduleManagement"),
      description: t("scheduleManagementDesc"),
      href: "/dashboard/admin/schedule",
      icon: CalendarClock,
      color: "bg-orange-600/20",
      iconColor: "text-orange-400",
      borderColor: "border-orange-500/30",
    },
    {
      title: t("billingManagement"),
      description: t("billingManagementDesc"),
      href: "/dashboard/admin/billing",
      icon: CreditCard,
      color: "bg-indigo-600/20",
      iconColor: "text-indigo-400",
      borderColor: "border-indigo-500/30",
    },
  ];

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t("title")}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {userName} {userLastName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:justify-end">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{tc("signOut")}</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1">
        <div className="space-y-8">
          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/50 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {t("welcome", { name: userName })}
            </h2>
            <p className="text-slate-700 dark:text-slate-300">
              {t("welcomeMessage")}
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-slate-100 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600/20 rounded-lg">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("totalWorkers")}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {totalWorkers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-600/20 rounded-lg">
                  <Building2 className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("workCenters")}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {totalCenters}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-600/20 rounded-lg">
                  <Clock className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t("activeToday")}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">
                    {activeToday}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Sections Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {adminSections.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                className={`group bg-slate-100 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl border ${section.borderColor} p-6 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-all`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3 ${section.color} rounded-lg`}>
                    <section.icon className={`w-6 h-6 ${section.iconColor}`} />
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 dark:text-slate-500 dark:group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mt-4 mb-1">
                  {section.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {section.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
