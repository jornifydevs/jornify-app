"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeftRight, Plus } from "lucide-react";
import type { ShiftSwapRequest } from "@/core/domain/entities";
import type { useShiftSwap } from "../_hooks/useShiftSwap";
import ShiftSwapRequestModal from "./ShiftSwapRequestModal";

interface ShiftSwapPanelProps {
  workerId: string;
  swapHook: ReturnType<typeof useShiftSwap>;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  awaiting_admin: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  approved: "bg-green-500/10 text-green-600 dark:text-green-400",
  rejected: "bg-red-500/10 text-red-600 dark:text-red-400",
  cancelled: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
};

function SwapCard({
  swap,
  workerId,
  onCancel,
  onRespond,
  submitting,
}: {
  swap: ShiftSwapRequest;
  workerId: string;
  onCancel: (id: string) => void;
  onRespond: (id: string, accept: boolean) => void;
  submitting: boolean;
}) {
  const t = useTranslations("dashboard.schedule.swaps");
  const isRequester = swap.requesterId === workerId;
  const isTarget = swap.targetId === workerId;

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
            {swap.requesterWorkdayId.slice(0, 8)}
          </span>
          <ArrowLeftRight className="w-3 h-3 text-slate-400" />
          <span className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
            {swap.targetWorkdayId.slice(0, 8)}
          </span>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            STATUS_STYLES[swap.status] ?? STATUS_STYLES.pending
          }`}
        >
          {t(`status.${swap.status}` as never)}
        </span>
      </div>

      {swap.requesterNote && (
        <p className="text-xs text-slate-500 dark:text-slate-400 italic">
          &ldquo;{swap.requesterNote}&rdquo;
        </p>
      )}

      <div className="flex gap-2">
        {/* Requester puede cancelar si está pending */}
        {isRequester && swap.status === "pending" && (
          <button
            onClick={() => onCancel(swap.id)}
            disabled={submitting}
            className="text-xs px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? t("cancelling") : t("cancel")}
          </button>
        )}

        {/* Target puede aceptar/rechazar si está pending */}
        {isTarget && swap.status === "pending" && (
          <>
            <button
              onClick={() => onRespond(swap.id, true)}
              disabled={submitting}
              className="text-xs px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg transition-colors disabled:opacity-50"
            >
              {t("accept")}
            </button>
            <button
              onClick={() => onRespond(swap.id, false)}
              disabled={submitting}
              className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-lg transition-colors disabled:opacity-50"
            >
              {t("reject")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ShiftSwapPanel({
  workerId,
  swapHook,
}: ShiftSwapPanelProps) {
  const t = useTranslations("dashboard.schedule.swaps");
  const [showModal, setShowModal] = useState(false);
  const {
    swaps,
    loading,
    submitting,
    error,
    successMessage,
    coworkers,
    myFutureWorkdays,
    targetWorkdays,
    loadingModalData,
    loadingTargetWorkdays,
    cancelSwap,
    respondToSwap,
    requestSwap,
    loadModalData,
    loadTargetWorkdays,
  } = swapHook;

  const handleOpenModal = () => {
    loadModalData();
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-orange-500" />
          {t("title")}
        </h2>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("request")}
        </button>
      </div>

      {showModal && (
        <ShiftSwapRequestModal
          coworkers={coworkers}
          myWorkdays={myFutureWorkdays}
          targetWorkdays={targetWorkdays}
          loadingData={loadingModalData}
          loadingTargetWorkdays={loadingTargetWorkdays}
          submitting={submitting}
          onLoadTargetWorkdays={loadTargetWorkdays}
          onSubmit={requestSwap}
          onClose={() => setShowModal(false)}
        />
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-600 dark:text-green-400 text-sm">
          {successMessage}
        </div>
      )}

      {loading ? (
        <div className="h-12 bg-slate-200 dark:bg-slate-700/50 rounded-xl animate-pulse" />
      ) : swaps.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
          {t("noSwaps")}
        </p>
      ) : (
        <div className="space-y-3">
          {swaps.map((swap) => (
            <SwapCard
              key={swap.id}
              swap={swap}
              workerId={workerId}
              onCancel={cancelSwap}
              onRespond={respondToSwap}
              submitting={submitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
