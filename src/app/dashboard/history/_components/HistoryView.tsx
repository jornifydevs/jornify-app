"use client";

import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";
import WorkHistory from "../../_components/WorkHistory";
import UserMenu from "../../_components/UserMenu";
import type { CenterFeature } from "@/core/domain/entities";
import type { RegistroJornadaMeta } from "@/lib/export-utils";
import { useTranslations } from "next-intl";

interface HistoryViewProps {
  workerId: string;
  userEmail: string;
  enabledFeatures: CenterFeature[];
  registroMeta?: RegistroJornadaMeta;
}

export default function HistoryView({
  workerId,
  userEmail,
  enabledFeatures,
  registroMeta,
}: HistoryViewProps) {
  const t = useTranslations("dashboard.history");
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center justify-center w-10 h-10 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-lg">
                <History className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t("pageTitle")}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>
          <UserMenu enabledFeatures={enabledFeatures} />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <WorkHistory workerId={workerId} registroMeta={registroMeta} />
      </main>
    </div>
  );
}
