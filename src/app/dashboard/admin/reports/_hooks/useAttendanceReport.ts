"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { SupabaseWorkdayRepository } from "@/infrastructure/supabase/repositories/supabase-workday.repository";
import { SupabaseTimeRecordRepository } from "@/infrastructure/supabase/repositories/supabase-time-record.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { SupabaseUserRepository } from "@/infrastructure/supabase/repositories/supabase-user.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { GetAttendanceReportUseCase } from "@/core/application/use-cases/admin/get-attendance-report.use-case";
import type { AttendanceRecord } from "@/core/application/dtos/admin-reports.dto";

export function useAttendanceReport() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(
    async (
      companyId: string,
      startDate: string,
      endDate: string,
      centerId?: string
    ) => {
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const workdayRepo = new SupabaseWorkdayRepository(supabase);
        const timeRecordRepo = new SupabaseTimeRecordRepository(supabase);
        const workerRepo = new SupabaseWorkerRepository(supabase);
        const userRepo = new SupabaseUserRepository(supabase);
        const centerRepo = new SupabaseCenterRepository(supabase);

        const useCase = new GetAttendanceReportUseCase(
          workdayRepo,
          timeRecordRepo,
          workerRepo,
          userRepo,
          centerRepo
        );

        const result = await useCase.execute({
          companyId,
          startDate,
          endDate,
          centerId: centerId || undefined,
        });

        setRecords(result);
      } catch {
        setError("Error al cargar el reporte");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatTime = (dateString?: string): string => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDayTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      normal: "Normal",
      holiday: "Festivo",
      vacation: "Vacaciones",
      sick_leave: "Baja médica",
    };
    return labels[type] ?? type;
  };

  const calculateTotalHours = (): string => {
    let totalSeconds = 0;
    records.forEach((r) => {
      if (r.totalHour) {
        const parts = r.totalHour.split(":").map(Number);
        totalSeconds +=
          (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
      }
    });
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return {
    records,
    loading,
    error,
    fetchReport,
    formatDate,
    formatTime,
    getDayTypeLabel,
    calculateTotalHours,
  };
}
