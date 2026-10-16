"use client";

import WorkHistory from "../../_components/WorkHistory";
import { PageHeader } from "@/components/PageHeader";
import type { RegistroJornadaMeta } from "@/lib/export-utils";
import { useTranslations } from "next-intl";

interface HistoryViewProps {
  workerId: string;
  registroMeta?: RegistroJornadaMeta;
}

export default function HistoryView({
  workerId,
  registroMeta,
}: HistoryViewProps) {
  const t = useTranslations("dashboard.history");
  return (
    <div>
      <div className="mx-auto max-w-4xl px-6 pt-6 lg:pt-8">
        <PageHeader title={t("pageTitle")} />
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <WorkHistory workerId={workerId} registroMeta={registroMeta} />
      </div>
    </div>
  );
}
