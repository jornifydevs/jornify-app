import { describe, it, expect, vi, beforeEach } from "vitest";
import { SetWorkerScheduleTemplateUseCase } from "@/core/application/use-cases/shifts/set-worker-schedule-template.use-case";
import type { WorkerScheduleTemplateRepository } from "@/core/domain/ports/repositories/worker-schedule-template.repository";
import { ValidationError } from "@/core/domain/errors/domain-errors";
import type {
  WorkerScheduleTemplate,
  WorkerScheduleTemplateDay,
} from "@/core/domain/entities";

const makeDays = (
  overrides: Partial<WorkerScheduleTemplateDay>[] = []
): WorkerScheduleTemplateDay[] =>
  [0, 1, 2, 3, 4, 5, 6].map((dow, i) => ({
    dayOfWeek: dow,
    isWorkingDay: dow >= 1 && dow <= 5,
    startWorkday: "09:00:00",
    endWorkday: "18:00:00",
    ...overrides[i],
  }));

const mockTemplate: WorkerScheduleTemplate = {
  id: "tpl-1",
  workerId: "worker-1",
  centerId: "center-1",
  days: makeDays(),
};

describe("SetWorkerScheduleTemplateUseCase", () => {
  let templateRepo: WorkerScheduleTemplateRepository;
  let useCase: SetWorkerScheduleTemplateUseCase;

  beforeEach(() => {
    templateRepo = {
      findByWorkerId: vi.fn(),
      findByWorkerIds: vi.fn(),
      upsert: vi.fn(),
    };
    useCase = new SetWorkerScheduleTemplateUseCase(templateRepo);
  });

  it("saves template successfully with 7 valid days", async () => {
    vi.mocked(templateRepo.upsert).mockResolvedValue(mockTemplate);

    const result = await useCase.execute({
      workerId: "worker-1",
      centerId: "center-1",
      days: makeDays(),
    });

    expect(result.id).toBe("tpl-1");
    expect(templateRepo.upsert).toHaveBeenCalledOnce();
  });

  it("throws ValidationError when days array has less than 7 entries", async () => {
    const days = makeDays().slice(0, 5);

    await expect(
      useCase.execute({ workerId: "worker-1", centerId: "center-1", days })
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when days array has more than 7 entries", async () => {
    const days = [
      ...makeDays(),
      {
        dayOfWeek: 1,
        isWorkingDay: true,
        startWorkday: "09:00:00",
        endWorkday: "18:00:00",
      },
    ];

    await expect(
      useCase.execute({ workerId: "worker-1", centerId: "center-1", days })
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when days are missing a day of week", async () => {
    // Two days with same dow
    const days = makeDays().map((d, i) =>
      i === 0 ? { ...d, dayOfWeek: 1 } : d
    );

    await expect(
      useCase.execute({ workerId: "worker-1", centerId: "center-1", days })
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when working day has no startWorkday", async () => {
    const days = makeDays();
    days[1] = {
      ...days[1],
      isWorkingDay: true,
      startWorkday: "",
      endWorkday: "18:00:00",
    };

    await expect(
      useCase.execute({ workerId: "worker-1", centerId: "center-1", days })
    ).rejects.toThrow(ValidationError);
  });

  it("accepts non-working days without time values", async () => {
    vi.mocked(templateRepo.upsert).mockResolvedValue(mockTemplate);

    const days = makeDays();
    days[0] = {
      dayOfWeek: 0,
      isWorkingDay: false,
      startWorkday: "",
      endWorkday: "",
    };
    days[6] = {
      dayOfWeek: 6,
      isWorkingDay: false,
      startWorkday: "",
      endWorkday: "",
    };

    await expect(
      useCase.execute({ workerId: "worker-1", centerId: "center-1", days })
    ).resolves.toBeDefined();
  });
});
