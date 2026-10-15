import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateSingleWorkdayUseCase } from "@/core/application/use-cases/shifts/create-single-workday.use-case";
import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";
import { ValidationError } from "@/core/domain/errors/domain-errors";
import type { Workday } from "@/core/domain/entities";

const mockWorkday: Workday = {
  id: "wd-1",
  workerId: "worker-1",
  centerId: "center-1",
  day: "2026-03-25",
  typeDay: "normal",
  startWorkday: "09:00:00",
  endWorkday: "18:00:00",
};

describe("CreateSingleWorkdayUseCase", () => {
  let workdayRepo: WorkdayRepository;
  let useCase: CreateSingleWorkdayUseCase;

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
    useCase = new CreateSingleWorkdayUseCase(workdayRepo);
  });

  it("creates a workday successfully when none exists for the date", async () => {
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(null);
    vi.mocked(workdayRepo.create).mockResolvedValue(mockWorkday);

    const result = await useCase.execute({
      workerId: "worker-1",
      centerId: "center-1",
      date: "2026-03-25",
      startWorkday: "09:00:00",
      endWorkday: "18:00:00",
    });

    expect(result.id).toBe("wd-1");
    expect(workdayRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        workerId: "worker-1",
        centerId: "center-1",
        day: "2026-03-25",
        typeDay: "normal",
        startWorkday: "09:00:00",
        endWorkday: "18:00:00",
      })
    );
  });

  it("throws ValidationError when workday already exists for that date", async () => {
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(mockWorkday);

    await expect(
      useCase.execute({
        workerId: "worker-1",
        centerId: "center-1",
        date: "2026-03-25",
        startWorkday: "09:00:00",
        endWorkday: "18:00:00",
      })
    ).rejects.toThrow(ValidationError);

    expect(workdayRepo.create).not.toHaveBeenCalled();
  });

  it("creates workday with break info when provided", async () => {
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(null);
    vi.mocked(workdayRepo.create).mockResolvedValue({
      ...mockWorkday,
      breakType: "scheduled",
      scheduledStartBreak: "13:00:00",
      scheduledEndBreak: "14:00:00",
    });

    await useCase.execute({
      workerId: "worker-1",
      centerId: "center-1",
      date: "2026-03-25",
      startWorkday: "09:00:00",
      endWorkday: "18:00:00",
      breakType: "scheduled",
      scheduledStartBreak: "13:00:00",
      scheduledEndBreak: "14:00:00",
    });

    expect(workdayRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        breakType: "scheduled",
        scheduledStartBreak: "13:00:00",
        scheduledEndBreak: "14:00:00",
      })
    );
  });
});
