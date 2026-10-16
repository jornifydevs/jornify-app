"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/infrastructure/supabase/client";
import { SupabaseWorkdayRepository } from "@/infrastructure/supabase/repositories/supabase-workday.repository";
import { SupabaseTimeRecordRepository } from "@/infrastructure/supabase/repositories/supabase-time-record.repository";
import { SupabaseWorkerRepository } from "@/infrastructure/supabase/repositories/supabase-worker.repository";
import { SupabaseCenterRepository } from "@/infrastructure/supabase/repositories/supabase-center.repository";
import { ClockInUseCase } from "@/core/application/use-cases/time-tracking/clock-in.use-case";
import { ClockOutUseCase } from "@/core/application/use-cases/time-tracking/clock-out.use-case";
import { StartBreakUseCase } from "@/core/application/use-cases/time-tracking/start-break.use-case";
import { EndBreakUseCase } from "@/core/application/use-cases/time-tracking/end-break.use-case";
import { DomainError } from "@/core/domain/errors/domain-errors";
import { CENTER_FEATURES } from "@/core/domain/entities/center-feature";
import { buildWorkdayTimeline } from "@/lib/workday-timeline";
import type {
  TimeRecord,
  Workday,
  CenterFeature,
} from "@/core/domain/entities";
import { useTranslations } from "next-intl";

interface UseTimeTrackerProps {
  workerId: string;
  enabledFeatures: CenterFeature[];
}

export function useTimeTracker({
  workerId,
  enabledFeatures,
}: UseTimeTrackerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeRecord, setActiveRecord] = useState<TimeRecord | null>(null);
  const [todayWorkday, setTodayWorkday] = useState<Workday | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [confirmingClockOut, setConfirmingClockOut] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [breakElapsedTime, setBreakElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const t = useTranslations("dashboard.timeTracker.errors");

  const supabase = useMemo(() => createClient(), []);
  const workdayRepo = useMemo(
    () => new SupabaseWorkdayRepository(supabase),
    [supabase]
  );
  const timeRecordRepo = useMemo(
    () => new SupabaseTimeRecordRepository(supabase),
    [supabase]
  );
  const workerRepo = useMemo(
    () => new SupabaseWorkerRepository(supabase),
    [supabase]
  );
  const centerRepo = useMemo(
    () => new SupabaseCenterRepository(supabase),
    [supabase]
  );

  const breakEnabled = enabledFeatures.includes(
    CENTER_FEATURES.BREAK as CenterFeature
  );

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate elapsed working time
  useEffect(() => {
    if (activeRecord?.startHour) {
      const timer = setInterval(() => {
        const start = new Date(activeRecord.startHour!);
        const now = new Date();
        let diff = Math.floor((now.getTime() - start.getTime()) / 1000);

        if (activeRecord.breakTotalHour) {
          // Break is done, subtract its total
          const [h, m, s] = activeRecord.breakTotalHour.split(":").map(Number);
          diff -= h * 3600 + m * 60 + s;
        } else if (activeRecord.breakStartHour) {
          // Break is active, freeze working timer at moment break started
          const breakStart = new Date(activeRecord.breakStartHour);
          diff = Math.floor((breakStart.getTime() - start.getTime()) / 1000);
        }

        setElapsedTime(Math.max(diff, 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [activeRecord]);

  // Calculate break elapsed time
  useEffect(() => {
    if (activeRecord?.breakStartHour && !activeRecord?.breakEndHour) {
      const timer = setInterval(() => {
        const breakStart = new Date(activeRecord.breakStartHour!);
        const now = new Date();
        setBreakElapsedTime(
          Math.floor((now.getTime() - breakStart.getTime()) / 1000)
        );
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setBreakElapsedTime(0);
    }
  }, [activeRecord]);

  // Load today's data
  const loadTodayData = useCallback(async () => {
    setInitializing(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      const workday = await workdayRepo.findByWorkerAndDate(workerId, today);

      if (workday) {
        setTodayWorkday(workday);
        const record = await timeRecordRepo.findActiveByWorkdayId(workday.id);
        setActiveRecord(record);
      } else {
        // No workday record yet (worker hasn't clocked in today).
        // Build a synthetic Workday from center defaults so the schedule
        // is visible before the first clock-in.
        const worker = await workerRepo.findById(workerId);
        if (worker) {
          const center = await centerRepo.findById(worker.centerId);
          if (center) {
            setTodayWorkday({
              id: "",
              workerId,
              centerId: worker.centerId,
              day: today,
              typeDay: "normal",
              startWorkday: center.defaultStartWorkday,
              endWorkday: center.defaultEndWorkday,
              breakType: center.breakType,
              scheduledStartBreak: center.defaultStartBreak,
              scheduledEndBreak: center.defaultEndBreak,
            });
          }
        }
      }
    } finally {
      setInitializing(false);
    }
  }, [workerId, workdayRepo, timeRecordRepo, workerRepo, centerRepo]);

  useEffect(() => {
    loadTodayData();
  }, [loadTodayData]);

  const handleClockIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const clockIn = new ClockInUseCase(
        workdayRepo,
        timeRecordRepo,
        workerRepo,
        centerRepo
      );
      const result = await clockIn.execute(workerId);
      setTodayWorkday(result.workday);
      setActiveRecord(result.timeRecord);
    } catch (e) {
      const message = e instanceof DomainError ? e.message : t("clockIn");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClockOut = () => {
    setConfirmingClockOut(true);
  };

  const handleCancelClockOut = () => {
    setConfirmingClockOut(false);
  };

  const handleClockOut = async () => {
    if (!activeRecord?.startHour) return;

    setConfirmingClockOut(false);
    setLoading(true);
    setError(null);
    try {
      const clockOut = new ClockOutUseCase(timeRecordRepo);
      await clockOut.execute(
        activeRecord.id,
        activeRecord.startHour,
        activeRecord.breakStartHour,
        activeRecord.breakTotalHour
      );
      setActiveRecord(null);
      setElapsedTime(0);
      setBreakElapsedTime(0);
    } catch (e) {
      const message = e instanceof DomainError ? e.message : t("clockOut");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setLoading(true);
    setError(null);
    try {
      const startBreak = new StartBreakUseCase(
        timeRecordRepo,
        workdayRepo,
        centerRepo
      );
      const updatedRecord = await startBreak.execute(workerId);
      setActiveRecord(updatedRecord);
    } catch (e) {
      const message = e instanceof DomainError ? e.message : t("startBreak");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!activeRecord?.breakStartHour) return;

    setLoading(true);
    setError(null);
    try {
      const endBreak = new EndBreakUseCase(timeRecordRepo);
      const updatedRecord = await endBreak.execute(
        activeRecord.id,
        activeRecord.breakStartHour
      );
      setActiveRecord(updatedRecord);
    } catch (e) {
      const message = e instanceof DomainError ? e.message : t("endBreak");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isWorking = !!activeRecord;
  const isOnBreak = !!(
    activeRecord?.breakStartHour && !activeRecord?.breakEndHour
  );
  const breakAlreadyTaken = !!activeRecord?.breakEndHour;

  const toMinutes = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };
  const nowMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const startMinutes = todayWorkday
    ? toMinutes(todayWorkday.startWorkday)
    : null;
  const endMinutes = todayWorkday ? toMinutes(todayWorkday.endWorkday) : null;
  const isWithinSchedule =
    startMinutes !== null &&
    endMinutes !== null &&
    nowMinutes >= startMinutes &&
    nowMinutes < endMinutes;
  const isBeforeSchedule = startMinutes !== null && nowMinutes < startMinutes;

  const timeline = todayWorkday
    ? buildWorkdayTimeline({
        scheduleStart: todayWorkday.startWorkday,
        scheduleEnd: todayWorkday.endWorkday,
        clockIn: activeRecord?.startHour,
        breakStart: activeRecord?.breakStartHour,
        breakEnd: activeRecord?.breakEndHour,
        now: currentTime,
      })
    : null;

  return {
    currentTime,
    isWorking,
    isOnBreak,
    initializing,
    confirmingClockOut,
    loading,
    error,
    elapsedTime,
    breakElapsedTime,
    breakEnabled,
    breakAlreadyTaken,
    isWithinSchedule,
    isBeforeSchedule,
    todayWorkday,
    timeline,
    clockedInAt: activeRecord?.startHour,
    breakStartedAt: activeRecord?.breakStartHour,
    handleClockIn,
    handleRequestClockOut,
    handleCancelClockOut,
    handleClockOut,
    handleStartBreak,
    handleEndBreak,
    formatElapsedTime,
  };
}
