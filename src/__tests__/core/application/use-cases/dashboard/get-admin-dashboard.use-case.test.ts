import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetAdminDashboardUseCase } from "@/core/application/use-cases/dashboard/get-admin-dashboard.use-case";
import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";

describe("GetAdminDashboardUseCase", () => {
  let workerRepo: WorkerRepository;
  let centerRepo: CenterRepository;
  let workdayRepo: WorkdayRepository;
  let useCase: GetAdminDashboardUseCase;

  beforeEach(() => {
    workerRepo = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findAll: vi.fn(),
      findByCenterId: vi.fn(),
      findByCenterIds: vi.fn(),
      countAll: vi.fn(),
      create: vi.fn(),
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
    useCase = new GetAdminDashboardUseCase(workerRepo, centerRepo, workdayRepo);
  });

  it("returns correct dashboard statistics", async () => {
    vi.mocked(workerRepo.countAll).mockResolvedValue(15);
    vi.mocked(centerRepo.countAll).mockResolvedValue(3);
    vi.mocked(workdayRepo.countActiveByDate).mockResolvedValue(8);

    const result = await useCase.execute();

    expect(result).toEqual({
      totalWorkers: 15,
      totalCenters: 3,
      activeToday: 8,
    });
  });

  it("returns zeros when no data exists", async () => {
    vi.mocked(workerRepo.countAll).mockResolvedValue(0);
    vi.mocked(centerRepo.countAll).mockResolvedValue(0);
    vi.mocked(workdayRepo.countActiveByDate).mockResolvedValue(0);

    const result = await useCase.execute();

    expect(result).toEqual({
      totalWorkers: 0,
      totalCenters: 0,
      activeToday: 0,
    });
  });

  it("fetches all counts in parallel", async () => {
    const workerPromise = new Promise<number>((resolve) =>
      setTimeout(() => resolve(5), 10)
    );
    const centerPromise = new Promise<number>((resolve) =>
      setTimeout(() => resolve(2), 10)
    );
    const workdayPromise = new Promise<number>((resolve) =>
      setTimeout(() => resolve(3), 10)
    );

    vi.mocked(workerRepo.countAll).mockReturnValue(workerPromise);
    vi.mocked(centerRepo.countAll).mockReturnValue(centerPromise);
    vi.mocked(workdayRepo.countActiveByDate).mockReturnValue(workdayPromise);

    const result = await useCase.execute();

    expect(result).toEqual({
      totalWorkers: 5,
      totalCenters: 2,
      activeToday: 3,
    });
  });
});
