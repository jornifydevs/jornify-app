import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RequestDayOffUseCase } from "@/core/application/use-cases/availability/request-day-off.use-case";
import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";
import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import {
  ValidationError,
  NotFoundError,
} from "@/core/domain/errors/domain-errors";
import type { Worker, Workday } from "@/core/domain/entities";

const mockWorker: Worker = {
  id: "worker-1",
  userId: "user-1",
  centerId: "center-1",
  dni: "12345678A",
  contractType: "full_time",
  hourWeek: 40,
  job: "Developer",
};

const makeWorkday = (day: string, typeDay = "vacation"): Workday => ({
  id: `wd-${day}`,
  workerId: "worker-1",
  centerId: "center-1",
  day,
  typeDay,
  startWorkday: "00:00:00",
  endWorkday: "00:00:00",
});

// Fija "hoy": el caso de uso rechaza fechas pasadas y los tests usan junio de 2026.
const FIXED_TODAY = new Date("2026-06-01T12:00:00Z");

describe("RequestDayOffUseCase", () => {
  let workdayRepo: WorkdayRepository;
  let workerRepo: WorkerRepository;
  let useCase: RequestDayOffUseCase;

  beforeEach(() => {
    vi.setSystemTime(FIXED_TODAY);
    workdayRepo = {
      findByWorkerAndDate: vi.fn(),
      findByWorkerInDateRange: vi.fn().mockResolvedValue([]),
      findByWorkerAndTypeDays: vi.fn(),
      create: vi.fn(),
      createMany: vi.fn(),
      countActiveByDate: vi.fn(),
      findByDateRange: vi.fn(),
      findByCenterAndDateRange: vi.fn(),
      findIdsByWorkerId: vi.fn(),
      deleteAllByWorkerId: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      updateWorkerId: vi.fn(),
    };
    workerRepo = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findAll: vi.fn(),
      findByCenterId: vi.fn(),
      findByCenterIds: vi.fn(),
      countAll: vi.fn(),
      create: vi.fn(),
      updateCenter: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new RequestDayOffUseCase(workdayRepo, workerRepo);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a single day-off successfully", async () => {
    const created = [makeWorkday("2026-06-15")];
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(workdayRepo.createMany).mockResolvedValue(created);

    const result = await useCase.execute({
      workerId: "worker-1",
      centerId: "center-1",
      startDay: "2026-06-15",
      endDay: "2026-06-15",
      typeDay: "vacation",
    });

    expect(result).toHaveLength(1);
    expect(result[0].day).toBe("2026-06-15");
    expect(workdayRepo.createMany).toHaveBeenCalledWith([
      expect.objectContaining({ day: "2026-06-15", typeDay: "vacation" }),
    ]);
  });

  it("creates multiple days for a date range", async () => {
    const created = [
      makeWorkday("2026-06-15"),
      makeWorkday("2026-06-16"),
      makeWorkday("2026-06-17"),
    ];
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(workdayRepo.createMany).mockResolvedValue(created);

    const result = await useCase.execute({
      workerId: "worker-1",
      centerId: "center-1",
      startDay: "2026-06-15",
      endDay: "2026-06-17",
      typeDay: "vacation",
    });

    expect(result).toHaveLength(3);
    expect(workdayRepo.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ day: "2026-06-15" }),
        expect.objectContaining({ day: "2026-06-16" }),
        expect.objectContaining({ day: "2026-06-17" }),
      ])
    );
  });

  it("accepts custom day types like 'mudanza'", async () => {
    const created = [makeWorkday("2026-06-15", "mudanza")];
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(workdayRepo.createMany).mockResolvedValue(created);

    const result = await useCase.execute({
      workerId: "worker-1",
      centerId: "center-1",
      startDay: "2026-06-15",
      endDay: "2026-06-15",
      typeDay: "mudanza",
    });

    expect(result[0].typeDay).toBe("mudanza");
  });

  it("throws ValidationError for 'normal' day type", async () => {
    await expect(
      useCase.execute({
        workerId: "worker-1",
        centerId: "center-1",
        startDay: "2026-06-15",
        endDay: "2026-06-15",
        typeDay: "normal",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError for empty day type", async () => {
    await expect(
      useCase.execute({
        workerId: "worker-1",
        centerId: "center-1",
        startDay: "2026-06-15",
        endDay: "2026-06-15",
        typeDay: "",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when startDay is after endDay", async () => {
    await expect(
      useCase.execute({
        workerId: "worker-1",
        centerId: "center-1",
        startDay: "2026-06-20",
        endDay: "2026-06-15",
        typeDay: "vacation",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError for past date", async () => {
    await expect(
      useCase.execute({
        workerId: "worker-1",
        centerId: "center-1",
        startDay: "2020-01-01",
        endDay: "2020-01-03",
        typeDay: "vacation",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("throws NotFoundError when worker does not exist", async () => {
    vi.mocked(workerRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute({
        workerId: "nonexistent",
        centerId: "center-1",
        startDay: "2026-06-15",
        endDay: "2026-06-15",
        typeDay: "vacation",
      })
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when dates already have non-normal records", async () => {
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(workdayRepo.findByWorkerInDateRange).mockResolvedValue([
      makeWorkday("2026-06-16", "vacation"),
    ]);

    await expect(
      useCase.execute({
        workerId: "worker-1",
        centerId: "center-1",
        startDay: "2026-06-15",
        endDay: "2026-06-17",
        typeDay: "vacation",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("updates existing normal workdays instead of blocking", async () => {
    const normalWorkday = makeWorkday("2026-06-15", "normal");
    const updated = makeWorkday("2026-06-15", "vacation");

    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(workdayRepo.findByWorkerInDateRange).mockResolvedValue([
      normalWorkday,
    ]);
    vi.mocked(workdayRepo.update).mockResolvedValue(updated);

    const result = await useCase.execute({
      workerId: "worker-1",
      centerId: "center-1",
      startDay: "2026-06-15",
      endDay: "2026-06-15",
      typeDay: "vacation",
    });

    expect(result).toHaveLength(1);
    expect(result[0].typeDay).toBe("vacation");
    expect(workdayRepo.update).toHaveBeenCalledWith(normalWorkday.id, {
      typeDay: "vacation",
      startWorkday: "00:00:00",
      endWorkday: "00:00:00",
    });
    expect(workdayRepo.createMany).not.toHaveBeenCalled();
  });

  it("updates existing normal days and creates new ones for mixed ranges", async () => {
    const normalWorkday = makeWorkday("2026-06-16", "normal");
    const updatedWorkday = makeWorkday("2026-06-16", "vacation");
    const createdWorkdays = [
      makeWorkday("2026-06-15", "vacation"),
      makeWorkday("2026-06-17", "vacation"),
    ];

    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(workdayRepo.findByWorkerInDateRange).mockResolvedValue([
      normalWorkday,
    ]);
    vi.mocked(workdayRepo.update).mockResolvedValue(updatedWorkday);
    vi.mocked(workdayRepo.createMany).mockResolvedValue(createdWorkdays);

    const result = await useCase.execute({
      workerId: "worker-1",
      centerId: "center-1",
      startDay: "2026-06-15",
      endDay: "2026-06-17",
      typeDay: "vacation",
    });

    expect(result).toHaveLength(3);
    expect(workdayRepo.update).toHaveBeenCalledTimes(1);
    expect(workdayRepo.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ day: "2026-06-15" }),
        expect.objectContaining({ day: "2026-06-17" }),
      ])
    );
  });
});
