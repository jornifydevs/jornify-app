import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GetLocalHolidaysUseCase,
  CreateLocalHolidayUseCase,
  DeleteLocalHolidayUseCase,
} from "@/core/application/use-cases/admin/manage-local-holidays.use-case";
import type { LocalHolidayRepository } from "@/core/domain/ports/repositories/local-holiday.repository";
import type { LocalHoliday } from "@/core/domain/entities";
import { ValidationError } from "@/core/domain/errors/domain-errors";

describe("GetLocalHolidaysUseCase", () => {
  let repo: LocalHolidayRepository;
  let useCase: GetLocalHolidaysUseCase;

  const mockHolidays: LocalHoliday[] = [
    {
      id: "lh1",
      centerId: "c1",
      date: "2026-06-24",
      name: "San Juan",
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "lh2",
      centerId: "c1",
      date: "2026-09-11",
      name: "Diada de Cataluña",
      createdAt: "2026-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    repo = {
      findByCenterIdAndYear: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new GetLocalHolidaysUseCase(repo);
  });

  it("should return local holidays for a center and year", async () => {
    vi.mocked(repo.findByCenterIdAndYear).mockResolvedValue(mockHolidays);

    const result = await useCase.execute("c1", 2026);

    expect(repo.findByCenterIdAndYear).toHaveBeenCalledWith("c1", 2026);
    expect(result).toEqual(mockHolidays);
  });

  it("should return empty array when no holidays exist", async () => {
    vi.mocked(repo.findByCenterIdAndYear).mockResolvedValue([]);

    const result = await useCase.execute("c1", 2026);

    expect(result).toEqual([]);
  });
});

describe("CreateLocalHolidayUseCase", () => {
  let repo: LocalHolidayRepository;
  let useCase: CreateLocalHolidayUseCase;

  beforeEach(() => {
    repo = {
      findByCenterIdAndYear: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new CreateLocalHolidayUseCase(repo);
  });

  it("should create a local holiday", async () => {
    const created: LocalHoliday = {
      id: "lh1",
      centerId: "c1",
      date: "2026-06-24",
      name: "San Juan",
    };
    vi.mocked(repo.create).mockResolvedValue(created);

    const result = await useCase.execute("c1", "2026-06-24", "San Juan");

    expect(repo.create).toHaveBeenCalledWith("c1", "2026-06-24", "San Juan");
    expect(result).toEqual(created);
  });

  it("should trim the holiday name", async () => {
    const created: LocalHoliday = {
      id: "lh1",
      centerId: "c1",
      date: "2026-06-24",
      name: "San Juan",
    };
    vi.mocked(repo.create).mockResolvedValue(created);

    await useCase.execute("c1", "2026-06-24", "  San Juan  ");

    expect(repo.create).toHaveBeenCalledWith("c1", "2026-06-24", "San Juan");
  });

  it("should throw ValidationError when date is empty", async () => {
    await expect(useCase.execute("c1", "", "San Juan")).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError when name is empty", async () => {
    await expect(useCase.execute("c1", "2026-06-24", "")).rejects.toThrow(
      ValidationError
    );
  });

  it("should throw ValidationError when name is only whitespace", async () => {
    await expect(useCase.execute("c1", "2026-06-24", "   ")).rejects.toThrow(
      ValidationError
    );
  });
});

describe("DeleteLocalHolidayUseCase", () => {
  let repo: LocalHolidayRepository;
  let useCase: DeleteLocalHolidayUseCase;

  beforeEach(() => {
    repo = {
      findByCenterIdAndYear: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new DeleteLocalHolidayUseCase(repo);
  });

  it("should delete a local holiday", async () => {
    vi.mocked(repo.delete).mockResolvedValue(undefined);

    await useCase.execute("lh1");

    expect(repo.delete).toHaveBeenCalledWith("lh1");
  });
});
