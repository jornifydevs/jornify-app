"use client";

import { useState, type ComponentProps } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeftRight, Plus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ShiftSwapRequest } from "@/core/domain/entities";
import type { useShiftSwap } from "../_hooks/useShiftSwap";
import ShiftSwapRequestModal from "./ShiftSwapRequestModal";

interface ShiftSwapPanelProps {
  workerId: string;
  swapHook: ReturnType<typeof useShiftSwap>;
}

type StatusTone = ComponentProps<typeof StatusBadge>["tone"];

// Waiting on someone → brand, approved → live, rejected → alert, cancelled → neutral.
const STATUS_TONES: Record<string, StatusTone> = {
  pending: "brand",
  awaiting_admin: "brand",
  approved: "live",
  rejected: "alert",
  cancelled: "neutral",
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
    <li className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs">
            {swap.requesterWorkdayId.slice(0, 8)}
          </span>
          <ArrowLeftRight
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="rounded bg-secondary px-2 py-0.5 font-mono text-xs">
            {swap.targetWorkdayId.slice(0, 8)}
          </span>
        </div>
        <StatusBadge
          tone={STATUS_TONES[swap.status] ?? STATUS_TONES.pending}
          size="sm"
        >
          {t(`status.${swap.status}` as never)}
        </StatusBadge>
      </div>

      {swap.requesterNote && (
        <p className="text-sm italic text-muted-foreground">
          &ldquo;{swap.requesterNote}&rdquo;
        </p>
      )}

      <div className="flex flex-wrap gap-2 empty:hidden">
        {/* Requester puede cancelar si está pending */}
        {isRequester && swap.status === "pending" && (
          <Button
            variant="outline"
            onClick={() => onCancel(swap.id)}
            disabled={submitting}
            className="flex-1 sm:flex-none"
          >
            {submitting ? t("cancelling") : t("cancel")}
          </Button>
        )}

        {/* Target puede aceptar/rechazar si está pending */}
        {isTarget && swap.status === "pending" && (
          <>
            <Button
              onClick={() => onRespond(swap.id, true)}
              disabled={submitting}
              className="flex-1 sm:flex-none"
            >
              {t("accept")}
            </Button>
            <Button
              variant="outline"
              onClick={() => onRespond(swap.id, false)}
              disabled={submitting}
              className="flex-1 sm:flex-none"
            >
              {t("reject")}
            </Button>
          </>
        )}
      </div>
    </li>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
        <Button
          variant="outline"
          onClick={handleOpenModal}
          className="w-full sm:w-auto"
        >
          <Plus />
          {t("request")}
        </Button>
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

      {error && <Alert variant="error">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      {loading ? (
        <div className="h-12 animate-pulse rounded-xl bg-track motion-reduce:animate-none" />
      ) : swaps.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          {t("noSwaps")}
        </p>
      ) : (
        <ul className="space-y-3">
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
        </ul>
      )}
    </div>
  );
}
