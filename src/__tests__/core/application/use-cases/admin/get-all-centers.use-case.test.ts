import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetAllCentersUseCase } from "@/core/application/use-cases/admin/get-all-centers.use-case";
import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import type { Center, Worker } from "@/core/domain/entities";

describe("GetAllCentersUseCase", () => {
  let centerRepo: CenterRepository;
  let workerRepo: WorkerRepository;
  let useCase: GetAllCentersUseCase;

  const mockCenter: Center = {
    id: "c1",
    companyId: "co1",
    name: "Oficina Central",
    address: "Calle 123",
    enabledFeatures: ["profile", "payroll"],
    allowedDayTypes: ["vacation", "sick_leave"],
    defaultStartWorkday: "09:00:00",
    defaultEndWorkday: "18:00:00",
    breakType: "none" as const,
  };

  const mockWorker: Worker = {
    id: "w1",
    userId: "u1",
    centerId: "c1",
    dni: "12345678A",
    contractType: "full_time",
    hourWeek: 40,
    job: "Developer",
  };

  beforeEach(() => {
    centerRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByCompanyId: vi.fn(),
      countAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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
    useCase = new GetAllCentersUseCase(centerRepo, workerRepo);
  });

  it("returns centers with worker count scoped by companyId", async () => {
    vi.mocked(centerRepo.findByCompanyId).mockResolvedValue([mockCenter]);
    vi.mocked(workerRepo.findByCenterId).mockResolvedValue([
      mockWorker,
      mockWorker,
    ]);

    const result = await useCase.execute("co1");

    expect(centerRepo.findByCompanyId).toHaveBeenCalledWith("co1");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Oficina Central");
    expect(result[0].workerCount).toBe(2);
  });

  it("returns empty array when company has no centers", async () => {
    vi.mocked(centerRepo.findByCompanyId).mockResolvedValue([]);

    const result = await useCase.execute("co1");

    expect(result).toEqual([]);
  });

  it("returns zero worker count for center with no workers", async () => {
    vi.mocked(centerRepo.findByCompanyId).mockResolvedValue([mockCenter]);
    vi.mocked(workerRepo.findByCenterId).mockResolvedValue([]);

    const result = await useCase.execute("co1");

    expect(result[0].workerCount).toBe(0);
  });
});
