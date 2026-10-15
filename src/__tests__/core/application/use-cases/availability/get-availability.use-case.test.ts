import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetAvailabilityUseCase } from "@/core/application/use-cases/availability/get-availability.use-case";
import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";
import type { Workday } from "@/core/domain/entities";

const mockVacation: Workday = {
  id: "wd-1",
  workerId: "worker-1",
  centerId: "center-1",
  day: "2026-03-15",
  typeDay: "vacation",
  startWorkday: "00:00:00",
  endWorkday: "00:00:00",
};

const mockHoliday: Workday = {
  id: "wd-2",
  workerId: "worker-1",
  centerId: "center-1",
  day: "2026-01-06",
  typeDay: "holiday",
  startWorkday: "00:00:00",
  endWorkday: "00:00:00",
};

describe("GetAvailabilityUseCase", () => {
  let workdayRepo: WorkdayRepository;
  let useCase: GetAvailabilityUseCase;

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
    useCase = new GetAvailabilityUseCase(workdayRepo);
  });

  it("fetches all non-normal day types when no typeDay filter is provided", async () => {
    vi.mocked(workdayRepo.findByWorkerAndTypeDays).mockResolvedValue([
      mockVacation,
      mockHoliday,
    ]);

    const result = await useCase.execute("worker-1");

    expect(workdayRepo.findByWorkerAndTypeDays).toHaveBeenCalledWith(
      "worker-1",
      [],
      undefined,
      undefined
    );
    expect(result).toHaveLength(2);
  });

  it("fetches only the specified type when typeDay is provided", async () => {
    vi.mocked(workdayRepo.findByWorkerAndTypeDays).mockResolvedValue([
      mockVacation,
    ]);

    const result = await useCase.execute("worker-1", "vacation");

    expect(workdayRepo.findByWorkerAndTypeDays).toHaveBeenCalledWith(
      "worker-1",
      ["vacation"],
      undefined,
      undefined
    );
    expect(result).toHaveLength(1);
  });

  it("applies year filter when provided", async () => {
    vi.mocked(workdayRepo.findByWorkerAndTypeDays).mockResolvedValue([]);

    await useCase.execute("worker-1", undefined, 2026);

    expect(workdayRepo.findByWorkerAndTypeDays).toHaveBeenCalledWith(
      "worker-1",
      [],
      "2026-01-01",
      "2026-12-31"
    );
  });

  it("supports custom day types like 'mudanza'", async () => {
    const mockMudanza: Workday = {
      ...mockVacation,
      id: "wd-3",
      typeDay: "mudanza",
    };
    vi.mocked(workdayRepo.findByWorkerAndTypeDays).mockResolvedValue([
      mockMudanza,
    ]);

    const result = await useCase.execute("worker-1", "mudanza");

    expect(workdayRepo.findByWorkerAndTypeDays).toHaveBeenCalledWith(
      "worker-1",
      ["mudanza"],
      undefined,
      undefined
    );
    expect(result).toHaveLength(1);
    expect(result[0].typeDay).toBe("mudanza");
  });

  it("returns empty array when no records found", async () => {
    vi.mocked(workdayRepo.findByWorkerAndTypeDays).mockResolvedValue([]);

    const result = await useCase.execute("worker-1");

    expect(result).toEqual([]);
  });
});
