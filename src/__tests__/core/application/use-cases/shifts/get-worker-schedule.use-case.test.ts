import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetWorkerScheduleUseCase } from "@/core/application/use-cases/shifts/get-worker-schedule.use-case";
import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";
import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import {
  NotFoundError,
  ValidationError,
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

const mockWorkdays: Workday[] = [
  {
    id: "wd-1",
    workerId: "worker-1",
    centerId: "center-1",
    day: "2026-03-24",
    typeDay: "normal",
    startWorkday: "08:00:00",
    endWorkday: "17:00:00",
  },
  {
    id: "wd-2",
    workerId: "worker-1",
    centerId: "center-1",
    day: "2026-03-25",
    typeDay: "normal",
    startWorkday: "08:00:00",
    endWorkday: "17:00:00",
  },
];

describe("GetWorkerScheduleUseCase", () => {
  let workdayRepo: WorkdayRepository;
  let workerRepo: WorkerRepository;
  let useCase: GetWorkerScheduleUseCase;

  beforeEach(() => {
    workdayRepo = {
      findByWorkerAndDate: vi.fn(),
      findByWorkerInDateRange: vi.fn(),
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
    };
    useCase = new GetWorkerScheduleUseCase(workdayRepo, workerRepo);
  });

  it("returns workdays for a valid date range", async () => {
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(workdayRepo.findByWorkerInDateRange).mockResolvedValue(
      mockWorkdays
    );

    const result = await useCase.execute(
      "worker-1",
      "2026-03-24",
      "2026-03-28"
    );

    expect(result).toEqual(mockWorkdays);
    expect(workdayRepo.findByWorkerInDateRange).toHaveBeenCalledWith(
      "worker-1",
      "2026-03-24",
      "2026-03-28"
    );
  });

  it("returns empty array when no workdays exist in range", async () => {
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(workdayRepo.findByWorkerInDateRange).mockResolvedValue([]);

    const result = await useCase.execute(
      "worker-1",
      "2026-03-24",
      "2026-03-28"
    );

    expect(result).toEqual([]);
  });

  it("throws NotFoundError when worker does not exist", async () => {
    vi.mocked(workerRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute("nonexistent", "2026-03-24", "2026-03-28")
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when startDate is after endDate", async () => {
    await expect(
      useCase.execute("worker-1", "2026-03-28", "2026-03-24")
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when dates are empty", async () => {
    await expect(useCase.execute("worker-1", "", "2026-03-28")).rejects.toThrow(
      ValidationError
    );
  });
});
