import { describe, it, expect, vi, beforeEach } from "vitest";
import { ExportWorkHistoryUseCase } from "@/core/application/use-cases/time-tracking/export-work-history.use-case";
import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";
import type { TimeRecordRepository } from "@/core/domain/ports/repositories/time-record.repository";
import type { Workday, TimeRecord } from "@/core/domain/entities";

const mockWorkdays: Workday[] = [
  {
    id: "wd-1",
    workerId: "w-1",
    centerId: "c-1",
    day: "2025-01-20",
    typeDay: "normal",
    startWorkday: "09:00:00",
    endWorkday: "18:00:00",
  },
  {
    id: "wd-2",
    workerId: "w-1",
    centerId: "c-1",
    day: "2025-01-21",
    typeDay: "normal",
    startWorkday: "09:00:00",
    endWorkday: "18:00:00",
  },
];

const mockTimeRecords: TimeRecord[] = [
  {
    id: "tr-1",
    workdayId: "wd-1",
    startHour: "2025-01-20T09:00:00Z",
    endHour: "2025-01-20T14:00:00Z",
    totalHour: "05:00:00",
  },
  {
    id: "tr-2",
    workdayId: "wd-2",
    startHour: "2025-01-21T09:00:00Z",
    endHour: "2025-01-21T17:00:00Z",
    totalHour: "08:00:00",
  },
];

describe("ExportWorkHistoryUseCase", () => {
  let workdayRepo: WorkdayRepository;
  let timeRecordRepo: TimeRecordRepository;
  let useCase: ExportWorkHistoryUseCase;

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
    };
    timeRecordRepo = {
      findActiveByWorkdayId: vi.fn(),
      findCompletedByWorkdayIds: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    useCase = new ExportWorkHistoryUseCase(workdayRepo, timeRecordRepo);
  });

  it("returns records with workday data joined correctly", async () => {
    vi.mocked(workdayRepo.findByWorkerInDateRange).mockResolvedValue(
      mockWorkdays
    );
    vi.mocked(timeRecordRepo.findCompletedByWorkdayIds).mockResolvedValue(
      mockTimeRecords
    );

    const result = await useCase.execute("w-1", "2025-01-20", "2025-01-21");

    expect(result).toHaveLength(2);
    expect(result[0].workday.id).toBe("wd-1");
    expect(result[1].workday.id).toBe("wd-2");
  });

  it("returns empty array when there are no workdays", async () => {
    vi.mocked(workdayRepo.findByWorkerInDateRange).mockResolvedValue([]);

    const result = await useCase.execute("w-1", "2025-01-20", "2025-01-21");

    expect(result).toEqual([]);
    expect(timeRecordRepo.findCompletedByWorkdayIds).not.toHaveBeenCalled();
  });

  it("calls findByWorkerInDateRange with correct args", async () => {
    vi.mocked(workdayRepo.findByWorkerInDateRange).mockResolvedValue([]);

    await useCase.execute("w-1", "2025-01-01", "2025-01-31");

    expect(workdayRepo.findByWorkerInDateRange).toHaveBeenCalledWith(
      "w-1",
      "2025-01-01",
      "2025-01-31"
    );
  });
});
