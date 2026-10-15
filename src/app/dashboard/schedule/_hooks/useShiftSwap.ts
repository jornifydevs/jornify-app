"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { SupabaseShiftSwapRequestRepository } from "@/infrastructure/supabase/repositories/supabase-shift-swap-request.repository";
import { SupabaseWorkdayRepository } from "@/infrastructure/supabase/repositories/supabase-workday.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { RequestShiftSwapUseCase } from "@/core/application/use-cases/shifts/request-shift-swap.use-case";
import { CancelShiftSwapUseCase } from "@/core/application/use-cases/shifts/cancel-shift-swap.use-case";
import { RespondToSwapRequestUseCase } from "@/core/application/use-cases/shifts/respond-to-swap-request.use-case";
import { GetPendingSwapsForWorkerUseCase } from "@/core/application/use-cases/shifts/get-pending-swaps-for-worker.use-case";
import type { ShiftSwapRequest, Worker, Workday } from "@/core/domain/entities";
import type { RequestShiftSwapInput } from "@/core/application/dtos/shifts.dto";
import { DomainError } from "@/core/domain/errors/domain-errors";
import { useTranslations } from "next-intl";

interface UseShiftSwapProps {
  workerId: string;
  centerId: string;
}

export function useShiftSwap({ workerId, centerId }: UseShiftSwapProps) {
  const [swaps, setSwaps] = useState<ShiftSwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [coworkers, setCoworkers] = useState<Worker[]>([]);
  const [myFutureWorkdays, setMyFutureWorkdays] = useState<Workday[]>([]);
  const [targetWorkdays, setTargetWorkdays] = useState<Workday[]>([]);
  const [loadingModalData, setLoadingModalData] = useState(false);
  const [loadingTargetWorkdays, setLoadingTargetWorkdays] = useState(false);

  const t = useTranslations("dashboard.schedule.swaps");

  const supabase = useMemo(() => createClient(), []);
  const swapRepo = useMemo(
    () => new SupabaseShiftSwapRequestRepository(supabase),
    [supabase]
  );
  const workdayRepo = useMemo(
    () => new SupabaseWorkdayRepository(supabase),
    [supabase]
  );
  const workerRepo = useMemo(
    () => new SupabaseWorkerRepository(supabase),
    [supabase]
  );

  const loadSwaps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const useCase = new GetPendingSwapsForWorkerUseCase(swapRepo);
      const result = await useCase.execute(workerId);
      setSwaps(result);
    } catch {
      setError(t("errors.loadSwaps"));
    } finally {
      setLoading(false);
    }
  }, [workerId, swapRepo, t]);

  useEffect(() => {
    loadSwaps();
  }, [loadSwaps]);

  const requestSwap = useCallback(
    async (input: Omit<RequestShiftSwapInput, "requesterId">) => {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      try {
        const useCase = new RequestShiftSwapUseCase(workdayRepo, swapRepo);
        await useCase.execute({ ...input, requesterId: workerId });
        setSuccessMessage(t("requestSuccess"));
        await loadSwaps();
        return true;
      } catch (e) {
        setError(e instanceof DomainError ? e.message : t("errors.submitSwap"));
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [workerId, workdayRepo, swapRepo, loadSwaps, t]
  );

  const cancelSwap = useCallback(
    async (swapId: string) => {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      try {
        const useCase = new CancelShiftSwapUseCase(swapRepo);
        await useCase.execute(swapId, workerId);
        setSuccessMessage(t("cancelSuccess"));
        await loadSwaps();
      } catch (e) {
        setError(e instanceof DomainError ? e.message : t("errors.cancelSwap"));
      } finally {
        setSubmitting(false);
      }
    },
    [workerId, swapRepo, loadSwaps, t]
  );

  const respondToSwap = useCallback(
    async (swapId: string, accept: boolean) => {
      setSubmitting(true);
      setError(null);
      try {
        const useCase = new RespondToSwapRequestUseCase(swapRepo);
        await useCase.execute(swapId, workerId, accept);
        await loadSwaps();
      } catch (e) {
        setError(e instanceof DomainError ? e.message : t("errors.submitSwap"));
      } finally {
        setSubmitting(false);
      }
    },
    [workerId, swapRepo, loadSwaps, t]
  );

  const loadModalData = useCallback(async () => {
    setLoadingModalData(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const [workers, workdays] = await Promise.all([
        workerRepo.findByCenterId(centerId),
        workdayRepo.findByWorkerInDateRange(workerId, today),
      ]);
      setCoworkers(workers.filter((w) => w.id !== workerId));
      setMyFutureWorkdays(workdays);
    } catch {
      // no bloquea la UI
    } finally {
      setLoadingModalData(false);
    }
  }, [centerId, workerId, workerRepo, workdayRepo]);

  const loadTargetWorkdays = useCallback(
    async (targetWorkerId: string) => {
      setTargetWorkdays([]);
      setLoadingTargetWorkdays(true);
      try {
        const today = new Date().toISOString().split("T")[0];
        const workdays = await workdayRepo.findByWorkerInDateRange(
          targetWorkerId,
          today
        );
        setTargetWorkdays(workdays);
      } catch {
        // no bloquea la UI
      } finally {
        setLoadingTargetWorkdays(false);
      }
    },
    [workdayRepo]
  );

  return {
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
    requestSwap,
    cancelSwap,
    respondToSwap,
    loadModalData,
    loadTargetWorkdays,
    clearMessages: () => {
      setError(null);
      setSuccessMessage(null);
    },
  };
}
