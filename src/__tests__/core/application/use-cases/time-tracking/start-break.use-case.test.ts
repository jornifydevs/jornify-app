import { describe, it, expect, vi, beforeEach } from "vitest";
import { StartBreakUseCase } from "@/core/application/use-cases/time-tracking/start-break.use-case";
import type { TimeRecordRepository } from "@/core/domain/ports/repositories/time-record.repository";
import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";
import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import { ClockError } from "@/core/domain/errors/domain-errors";
import type { Workday, TimeRecord, Center } from "@/core/domain/entities";

const today = new Date().toISOString().split("T")[0];

const mockCenter: Center = {
  id: "center-1",
  companyId: "company-1",
  name: "Oficina Central",
  address: "Calle Test 1",
  enabledFeatures: ["break"],
  allowedDayTypes: ["normal"],
  defaultStartWorkday: "09:00:00",
  defaultEndWorkday: "18:00:00",
  breakType: "free",
};

const mockWorkday: Workday = {
  id: "workday-1",
  workerId: "worker-1",
  centerId: "center-1",
  day: today,
  typeDay: "normal",
  startWorkday: "09:00:00",
  endWorkday: "18:00:00",
  breakType: "free",
};

const mockActiveRecord: TimeRecord = {
  id: "record-1",
  workdayId: "workday-1",
  startHour: new Date(Date.now() - 3600000).toISOString(),
};

describe("StartBreakUseCase", () => {
  let timeRecordRepo: TimeRecordRepository;
  let workdayRepo: WorkdayRepository;
  let centerRepo: CenterRepository;
  let useCase: StartBreakUseCase;

  beforeEach(() => {
    timeRecordRepo = {
      findActiveByWorkdayId: vi.fn(),
      findCompletedByWorkdayIds: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    workdayRepo = {
      findByWorkerAndDate: vi.fn(),
      findByWorkerInDateRange: vi.fn(),
      findByWorkerAndTypeDays: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      countActiveByDate: vi.fn(),
      findByDateRange: vi.fn(),
      findByCenterAndDateRange: vi.fn(),
    };
    centerRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByCompanyId: vi.fn(),
      countAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new StartBreakUseCase(timeRecordRepo, workdayRepo, centerRepo);
  });

  it("starts break successfully for free break type", async () => {
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(mockWorkday);
    vi.mocked(centerRepo.findById).mockResolvedValue(mockCenter);
    vi.mocked(timeRecordRepo.findActiveByWorkdayId).mockResolvedValue(
      mockActiveRecord
    );

    const updatedRecord: TimeRecord = {
      ...mockActiveRecord,
      breakStartHour: new Date().toISOString(),
    };
    vi.mocked(timeRecordRepo.update).mockResolvedValue(updatedRecord);

    const result = await useCase.execute("worker-1");

    expect(timeRecordRepo.update).toHaveBeenCalledWith(
      "record-1",
      expect.objectContaining({
        breakStartHour: expect.any(String),
      })
    );
    expect(result.breakStartHour).toBeDefined();
  });

  it("throws ClockError when no active workday exists", async () => {
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(null);

    await expect(useCase.execute("worker-1")).rejects.toThrow(ClockError);
    await expect(useCase.execute("worker-1")).rejects.toThrow(
      "No hay jornada activa hoy"
    );
  });

  it("throws ClockError when break feature is not enabled for center", async () => {
    const centerNoBreak: Center = {
      ...mockCenter,
      enabledFeatures: [],
    };
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(mockWorkday);
    vi.mocked(centerRepo.findById).mockResolvedValue(centerNoBreak);

    await expect(useCase.execute("worker-1")).rejects.toThrow(ClockError);
    await expect(useCase.execute("worker-1")).rejects.toThrow(
      "La funcionalidad de descanso no está habilitada"
    );
  });

  it("throws ClockError when breakType is none", async () => {
    const workdayNoBreak: Workday = {
      ...mockWorkday,
      breakType: "none",
    };
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(
      workdayNoBreak
    );
    vi.mocked(centerRepo.findById).mockResolvedValue(mockCenter);

    await expect(useCase.execute("worker-1")).rejects.toThrow(ClockError);
    await expect(useCase.execute("worker-1")).rejects.toThrow(
      "Este centro no tiene descansos configurados"
    );
  });

  it("throws ClockError when no active time record exists", async () => {
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(mockWorkday);
    vi.mocked(centerRepo.findById).mockResolvedValue(mockCenter);
    vi.mocked(timeRecordRepo.findActiveByWorkdayId).mockResolvedValue(null);

    await expect(useCase.execute("worker-1")).rejects.toThrow(ClockError);
    await expect(useCase.execute("worker-1")).rejects.toThrow(
      "No hay registro de fichaje activo"
    );
  });

  it("throws ClockError when break already taken", async () => {
    const recordWithBreak: TimeRecord = {
      ...mockActiveRecord,
      breakStartHour: new Date().toISOString(),
      breakEndHour: new Date().toISOString(),
      breakTotalHour: "01:00:00",
    };
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(mockWorkday);
    vi.mocked(centerRepo.findById).mockResolvedValue(mockCenter);
    vi.mocked(timeRecordRepo.findActiveByWorkdayId).mockResolvedValue(
      recordWithBreak
    );

    await expect(useCase.execute("worker-1")).rejects.toThrow(ClockError);
    await expect(useCase.execute("worker-1")).rejects.toThrow(
      "Ya se ha registrado un descanso hoy"
    );
  });

  it("throws ClockError when outside scheduled break window", async () => {
    // Set scheduled break window to a time that's definitely not now
    const scheduledWorkday: Workday = {
      ...mockWorkday,
      breakType: "scheduled",
      scheduledStartBreak: "03:00:00",
      scheduledEndBreak: "03:30:00",
    };
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(
      scheduledWorkday
    );
    vi.mocked(centerRepo.findById).mockResolvedValue(mockCenter);
    vi.mocked(timeRecordRepo.findActiveByWorkdayId).mockResolvedValue(
      mockActiveRecord
    );

    // This test may pass or fail depending on time of execution
    // Using 03:00-03:30 window which is unlikely to be the current time
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const withinWindow = currentMinutes >= 180 && currentMinutes < 210;

    if (!withinWindow) {
      await expect(useCase.execute("worker-1")).rejects.toThrow(ClockError);
    }
  });
});
