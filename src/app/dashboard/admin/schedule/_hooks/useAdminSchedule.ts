"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/infrastructure/supabase/client";
import { SupabaseWorkdayRepository } from "@/infrastructure/supabase/repositories/supabase-workday.repository";
import { SupabaseShiftSwapRequestRepository } from "@/infrastructure/supabase/repositories/supabase-shift-swap-request.repository";
import { SupabaseWorkerScheduleTemplateRepository } from "@/infrastructure/supabase/repositories/supabase-worker-schedule-template.repository";
import { GetPendingSwapsForAdminUseCase } from "@/core/application/use-cases/shifts/get-pending-swaps-for-admin.use-case";
import { UpdateWorkerShiftUseCase } from "@/core/application/use-cases/shifts/update-worker-shift.use-case";
import { ReviewShiftSwapUseCase } from "@/core/application/use-cases/shifts/review-shift-swap.use-case";
import { SetWorkerScheduleTemplateUseCase } from "@/core/application/use-cases/shifts/set-worker-schedule-template.use-case";
import { GenerateWorkdaysFromTemplateUseCase } from "@/core/application/use-cases/shifts/generate-workdays-from-template.use-case";
import { CreateSingleWorkdayUseCase } from "@/core/application/use-cases/shifts/create-single-workday.use-case";
import type {
  Workday,
  ShiftSwapRequest,
  WorkerScheduleTemplate,
  WorkerScheduleTemplateDay,
  Center,
} from "@/core/domain/entities";
import type {
  UpdateShiftInput,
  ReviewShiftSwapInput,
} from "@/core/application/dtos/shifts.dto";
import { DomainError } from "@/core/domain/errors/domain-errors";
import { useTranslations, useLocale } from "next-intl";

interface UseAdminScheduleProps {
  centerId: string;
  adminUserId: string;
  center: Center;
  initialTemplates: WorkerScheduleTemplate[];
}

export function useAdminSchedule({
  centerId,
  adminUserId,
  center,
  initialTemplates,
}: UseAdminScheduleProps) {
  const [pendingSwaps, setPendingSwaps] = useState<ShiftSwapRequest[]>([]);
  const [loadingSwaps, setLoadingSwaps] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [templates, setTemplates] =
    useState<WorkerScheduleTemplate[]>(initialTemplates);

  const t = useTranslations("dashboard.admin.schedule");
  const locale = useLocale();
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);
  const workdayRepo = useMemo(
    () => new SupabaseWorkdayRepository(supabase),
    [supabase]
  );
  const swapRepo = useMemo(
    () => new SupabaseShiftSwapRequestRepository(supabase),
    [supabase]
  );
  const templateRepo = useMemo(
    () => new SupabaseWorkerScheduleTemplateRepository(supabase),
    [supabase]
  );

  const getWeekDates = useCallback((offset: number) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysToMonday + offset * 7);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const toLocal = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    return {
      startDate: toLocal(monday),
      endDate: toLocal(sunday),
      monday,
      sunday,
    };
  }, []);

  const loadPendingSwaps = useCallback(async () => {
    setLoadingSwaps(true);
    try {
      const useCase = new GetPendingSwapsForAdminUseCase(swapRepo);
      const result = await useCase.execute(centerId);
      setPendingSwaps(result);
    } catch {
      setError(t("errors.loadSchedule"));
    } finally {
      setLoadingSwaps(false);
    }
  }, [centerId, swapRepo, t]);

  useEffect(() => {
    loadPendingSwaps();
  }, [loadPendingSwaps]);

  const updateShift = useCallback(
    async (workdayId: string, input: UpdateShiftInput) => {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      try {
        const useCase = new UpdateWorkerShiftUseCase(workdayRepo);
        await useCase.execute(workdayId, input);
        setSuccessMessage(t("shiftUpdated"));
        return true;
      } catch (e) {
        setError(
          e instanceof DomainError ? e.message : t("errors.updateShift")
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [workdayRepo, t]
  );

  const reviewSwap = useCallback(
    async (input: Omit<ReviewShiftSwapInput, "reviewedBy">) => {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      try {
        const useCase = new ReviewShiftSwapUseCase(swapRepo, workdayRepo);
        await useCase.execute({ ...input, reviewedBy: adminUserId });
        setSuccessMessage(
          input.approve ? t("swapApproved") : t("swapRejected")
        );
        await loadPendingSwaps();
      } catch (e) {
        setError(e instanceof DomainError ? e.message : t("errors.reviewSwap"));
      } finally {
        setSubmitting(false);
      }
    },
    [adminUserId, swapRepo, workdayRepo, loadPendingSwaps, t]
  );

  const saveTemplate = useCallback(
    async (
      workerId: string,
      days: WorkerScheduleTemplateDay[]
    ): Promise<boolean> => {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      try {
        const setUseCase = new SetWorkerScheduleTemplateUseCase(templateRepo);
        const saved = await setUseCase.execute({ workerId, centerId, days });

        setTemplates((prev) => {
          const idx = prev.findIndex((t) => t.workerId === workerId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = saved;
            return next;
          }
          return [...prev, saved];
        });

        const today = new Date();
        const toLocal = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 365);

        const generateUseCase = new GenerateWorkdaysFromTemplateUseCase(
          templateRepo,
          workdayRepo
        );
        const result = await generateUseCase.execute({
          workerId,
          centerId,
          startDate: toLocal(today),
          endDate: toLocal(endDate),
          centerDefaultStart: center.defaultStartWorkday,
          centerDefaultEnd: center.defaultEndWorkday,
          centerBreakType: center.breakType,
          centerDefaultStartBreak: center.defaultStartBreak,
          centerDefaultEndBreak: center.defaultEndBreak,
        });

        setSuccessMessage(t("workdaysGenerated", { count: result.created }));
        router.refresh();
        return true;
      } catch (e) {
        setError(
          e instanceof DomainError ? e.message : t("errors.saveTemplate")
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [centerId, center, templateRepo, workdayRepo, t, router]
  );

  const createWorkday = useCallback(
    async (workerId: string, date: string): Promise<Workday | null> => {
      setSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      try {
        const useCase = new CreateSingleWorkdayUseCase(workdayRepo);
        const workday = await useCase.execute({
          workerId,
          centerId,
          date,
          startWorkday: center.defaultStartWorkday,
          endWorkday: center.defaultEndWorkday,
          breakType: center.breakType,
          scheduledStartBreak: center.defaultStartBreak,
          scheduledEndBreak: center.defaultEndBreak,
        });
        return workday;
      } catch (e) {
        setError(
          e instanceof DomainError ? e.message : t("errors.createWorkday")
        );
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [centerId, center, workdayRepo, t]
  );

  const { startDate, endDate, monday, sunday } = getWeekDates(weekOffset);

  const weekLabel = `${monday.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
  })} – ${sunday.toLocaleDateString(locale, { day: "numeric", month: "short" })}`;

  return {
    pendingSwaps,
    loadingSwaps,
    submitting,
    error,
    successMessage,
    weekOffset,
    weekLabel,
    startDate,
    endDate,
    templates,
    goToPreviousWeek: () => setWeekOffset((o) => o - 1),
    goToNextWeek: () => setWeekOffset((o) => o + 1),
    goToCurrentWeek: () => setWeekOffset(0),
    updateShift,
    reviewSwap,
    saveTemplate,
    createWorkday,
    clearMessages: () => {
      setError(null);
      setSuccessMessage(null);
    },
    reloadSwaps: loadPendingSwaps,
  };
}
