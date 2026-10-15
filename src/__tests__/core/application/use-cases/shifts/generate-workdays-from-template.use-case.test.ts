import { describe, it, expect, vi, beforeEach } from "vitest";
import { GenerateWorkdaysFromTemplateUseCase } from "@/core/application/use-cases/shifts/generate-workdays-from-template.use-case";
import type { WorkerScheduleTemplateRepository } from "@/core/domain/ports/repositories/worker-schedule-template.repository";
import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";
import type { WorkerScheduleTemplate, Workday } from "@/core/domain/entities";

const makeTemplate = (): WorkerScheduleTemplate => ({
  id: "tpl-1",
  workerId: "worker-1",
  centerId: "center-1",
  days: [0, 1, 2, 3, 4, 5, 6].map((dow) => ({
    dayOfWeek: dow,
    isWorkingDay: dow >= 1 && dow <= 5, // Mon-Fri
    startWorkday: "09:00:00",
    endWorkday: "18:00:00",
  })),
});

const makeWorkday = (day: string): Workday => ({
  id: `wd-${day}`,
  workerId: "worker-1",
  centerId: "center-1",
  day,
  typeDay: "normal",
  startWorkday: "09:00:00",
  endWorkday: "18:00:00",
});

describe("GenerateWorkdaysFromTemplateUseCase", () => {
  let templateRepo: WorkerScheduleTemplateRepository;
  let workdayRepo: WorkdayRepository;
  let useCase: GenerateWorkdaysFromTemplateUseCase;

  beforeEach(() => {
    templateRepo = {
      findByWorkerId: vi.fn(),
      findByWorkerIds: vi.fn(),
      upsert: vi.fn(),
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
      findIdsByWorkerId: vi.fn(),
      deleteAllByWorkerId: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      updateWorkerId: vi.fn(),
    };
    useCase = new GenerateWorkdaysFromTemplateUseCase(
      templateRepo,
      workdayRepo
    );
  });

  it("generates workdays for Mon-Fri from template", async () => {
    vi.mocked(templateRepo.findByWorkerId).mockResolvedValue(makeTemplate());
    vi.mocked(workdayRepo.findByWorkerInDateRange).mockResolvedValue([]);
    vi.mocked(workdayRepo.createMany).mockResolvedValue([]);

    // A week: Mon 2026-03-23 to Sun 2026-03-29
    const result = await useCase.execute({
      workerId: "worker-1",
      centerId: "center-1",
      startDate: "2026-03-23",
      endDate: "2026-03-29",
      centerDefaultStart: "08:00:00",
      centerDefaultEnd: "17:00:00",
    });

    // Should create Mon-Fri = 5 days
    expect(result.created).toBe(5);
    expect(workdayRepo.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          day: "2026-03-23",
          startWorkday: "09:00:00",
        }),
        expect.objectContaining({ day: "2026-03-27" }),
      ])
    );
  });

  it("skips existing workdays", async () => {
    vi.mocked(templateRepo.findByWorkerId).mockResolvedValue(makeTemplate());
    vi.mocked(workdayRepo.findByWorkerInDateRange).mockResolvedValue([
      makeWorkday("2026-03-23"), // Monday already exists
    ]);
    vi.mocked(workdayRepo.createMany).mockResolvedValue([]);

    const result = await useCase.execute({
      workerId: "worker-1",
      centerId: "center-1",
      startDate: "2026-03-23",
      endDate: "2026-03-29",
      centerDefaultStart: "08:00:00",
      centerDefaultEnd: "17:00:00",
    });

    expect(result.created).toBe(4); // 5 - 1 existing
    expect(result.skipped).toBe(1);
  });

  it("falls back to Mon-Fri defaults when no template exists", async () => {
    vi.mocked(templateRepo.findByWorkerId).mockResolvedValue(null);
    vi.mocked(workdayRepo.findByWorkerInDateRange).mockResolvedValue([]);
    vi.mocked(workdayRepo.createMany).mockResolvedValue([]);

    const result = await useCase.execute({
      workerId: "worker-1",
      centerId: "center-1",
      startDate: "2026-03-23",
      endDate: "2026-03-29",
      centerDefaultStart: "08:00:00",
      centerDefaultEnd: "17:00:00",
    });

    expect(result.created).toBe(5);
    expect(workdayRepo.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          startWorkday: "08:00:00",
          endWorkday: "17:00:00",
        }),
      ])
    );
  });

  it("does not call createMany when no days to create", async () => {
    vi.mocked(templateRepo.findByWorkerId).mockResolvedValue(makeTemplate());
    // All Mon-Fri already exist
    vi.mocked(workdayRepo.findByWorkerInDateRange).mockResolvedValue([
      makeWorkday("2026-03-23"),
      makeWorkday("2026-03-24"),
      makeWorkday("2026-03-25"),
      makeWorkday("2026-03-26"),
      makeWorkday("2026-03-27"),
    ]);

    const result = await useCase.execute({
      workerId: "worker-1",
      centerId: "center-1",
      startDate: "2026-03-23",
      endDate: "2026-03-29",
      centerDefaultStart: "08:00:00",
      centerDefaultEnd: "17:00:00",
    });

    expect(result.created).toBe(0);
    expect(workdayRepo.createMany).not.toHaveBeenCalled();
  });
});
