"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { SupabaseWorkdayRepository } from "@/infrastructure/supabase/repositories/supabase-workday.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { GetAvailabilityUseCase } from "@/core/application/use-cases/availability/get-availability.use-case";
import { RequestDayOffUseCase } from "@/core/application/use-cases/availability/request-day-off.use-case";
import { DomainError } from "@/core/domain/errors/domain-errors";
import type { Workday } from "@/core/domain/entities";

interface UseAvailabilityProps {
  workerId: string;
  centerId: string;
}

const DAY_TYPE_LABELS: Record<string, string> = {
  vacation: "Vacaciones",
  holiday: "Festivo",
  sick_leave: "Baja médica",
};

export function useAvailability({ workerId, centerId }: UseAvailabilityProps) {
  const [allRecords, setAllRecords] = useState<Workday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);

  const [isRequesting, setIsRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const supabase = createClient();
  const workdayRepo = new SupabaseWorkdayRepository(supabase);
  const workerRepo = new SupabaseWorkerRepository(supabase);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const useCase = new GetAvailabilityUseCase(workdayRepo);
      const result = await useCase.execute(workerId, undefined, yearFilter);
      setAllRecords(result);
    } catch (e) {
      const message =
        e instanceof DomainError
          ? e.message
          : "Error al cargar la disponibilidad";
      setError(message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerId, yearFilter]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const availableTypes = useMemo(() => {
    const types = [...new Set(allRecords.map((r) => r.typeDay))];
    return types.sort();
  }, [allRecords]);

  const filteredRecords = useMemo(() => {
    if (!typeFilter) return allRecords;
    return allRecords.filter((r) => r.typeDay === typeFilter);
  }, [allRecords, typeFilter]);

  const requestDayOff = async (
    startDay: string,
    endDay: string,
    typeDay: string
  ) => {
    setRequestError(null);
    setRequestSuccess(false);
    setIsRequesting(true);

    try {
      const useCase = new RequestDayOffUseCase(workdayRepo, workerRepo);
      await useCase.execute({
        workerId,
        centerId,
        startDay,
        endDay,
        typeDay,
      });
      setRequestSuccess(true);
      setShowRequestForm(false);
      await loadRecords();
    } catch (e) {
      const message =
        e instanceof DomainError
          ? e.message
          : "Error al solicitar el día libre";
      setRequestError(message);
    } finally {
      setIsRequesting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString + "T00:00:00").toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDayTypeLabel = (typeDay: string): string => {
    return DAY_TYPE_LABELS[typeDay] ?? typeDay.replace(/_/g, " ");
  };

  return {
    records: filteredRecords,
    loading,
    error,
    typeFilter,
    setTypeFilter,
    yearFilter,
    setYearFilter,
    availableTypes,
    showRequestForm,
    setShowRequestForm,
    isRequesting,
    requestError,
    requestSuccess,
    setRequestSuccess,
    requestDayOff,
    formatDate,
    getDayTypeLabel,
  };
}
