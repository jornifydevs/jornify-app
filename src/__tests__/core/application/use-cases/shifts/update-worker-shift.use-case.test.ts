import { describe, it, expect, vi, beforeEach } from "vitest";
import { UpdateWorkerShiftUseCase } from "@/core/application/use-cases/shifts/update-worker-shift.use-case";
import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";
import {
  NotFoundError,
  ValidationError,
} from "@/core/domain/errors/domain-errors";
import type { Workday } from "@/core/domain/entities";

const mockWorkday: Workday = {
  id: "wd-1",
  workerId: "worker-1",
  centerId: "center-1",
  day: "2026-03-24",
  typeDay: "normal",
  startWorkday: "08:00:00",
  endWorkday: "17:00:00",
  breakType: "free",
};

describe("UpdateWorkerShiftUseCase", () => {
  let workdayRepo: WorkdayRepository;
  let useCase: UpdateWorkerShiftUseCase;

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
    useCase = new UpdateWorkerShiftUseCase(workdayRepo);
  });

  it("updates shift successfully with valid input", async () => {
    const updated: Workday = {
      ...mockWorkday,
      startWorkday: "09:00:00",
      endWorkday: "18:00:00",
    };
    vi.mocked(workdayRepo.findById).mockResolvedValue(mockWorkday);
    vi.mocked(workdayRepo.update).mockResolvedValue(updated);

    const result = await useCase.execute("wd-1", {
      startWorkday: "09:00:00",
      endWorkday: "18:00:00",
    });

    expect(result.startWorkday).toBe("09:00:00");
    expect(workdayRepo.update).toHaveBeenCalledWith(
      "wd-1",
      expect.objectContaining({
        startWorkday: "09:00:00",
        endWorkday: "18:00:00",
      })
    );
  });

  it("throws NotFoundError when workday does not exist", async () => {
    vi.mocked(workdayRepo.findById).mockResolvedValue(null);

    await expect(
      useCase.execute("nonexistent", {
        startWorkday: "09:00:00",
        endWorkday: "18:00:00",
      })
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when startWorkday is after endWorkday", async () => {
    vi.mocked(workdayRepo.findById).mockResolvedValue(mockWorkday);

    await expect(
      useCase.execute("wd-1", {
        startWorkday: "18:00:00",
        endWorkday: "09:00:00",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when scheduled break has no times", async () => {
    vi.mocked(workdayRepo.findById).mockResolvedValue(mockWorkday);

    await expect(
      useCase.execute("wd-1", {
        startWorkday: "08:00:00",
        endWorkday: "17:00:00",
        breakType: "scheduled",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("updates successfully with scheduled break times", async () => {
    const updated: Workday = {
      ...mockWorkday,
      breakType: "scheduled",
      scheduledStartBreak: "13:00:00",
      scheduledEndBreak: "14:00:00",
    };
    vi.mocked(workdayRepo.findById).mockResolvedValue(mockWorkday);
    vi.mocked(workdayRepo.update).mockResolvedValue(updated);

    await useCase.execute("wd-1", {
      startWorkday: "08:00:00",
      endWorkday: "17:00:00",
      breakType: "scheduled",
      scheduledStartBreak: "13:00:00",
      scheduledEndBreak: "14:00:00",
    });

    expect(workdayRepo.update).toHaveBeenCalledWith(
      "wd-1",
      expect.objectContaining({
        breakType: "scheduled",
        scheduledStartBreak: "13:00:00",
        scheduledEndBreak: "14:00:00",
      })
    );
  });
});
