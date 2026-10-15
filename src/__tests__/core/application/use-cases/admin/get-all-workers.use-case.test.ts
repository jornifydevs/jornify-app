import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetAllWorkersUseCase } from "@/core/application/use-cases/admin/get-all-workers.use-case";
import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import type { UserRepository } from "@/core/domain/ports/repositories/user.repository";
import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import type { Worker, User, Center } from "@/core/domain/entities";

describe("GetAllWorkersUseCase", () => {
  let workerRepo: WorkerRepository;
  let userRepo: UserRepository;
  let centerRepo: CenterRepository;
  let useCase: GetAllWorkersUseCase;

  const mockCenter: Center = {
    id: "c1",
    companyId: "co1",
    name: "Oficina Central",
    address: "Calle 123",
    enabledFeatures: [],
    allowedDayTypes: [],
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

  const mockUser: User = {
    id: "u1",
    name: "Juan",
    lastName: "García",
    email: "juan@test.com",
    role: "worker",
  };

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
    userRepo = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findWorkersByCompanyId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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
    useCase = new GetAllWorkersUseCase(workerRepo, userRepo, centerRepo);
  });

  it("returns enriched worker list scoped by companyId", async () => {
    vi.mocked(centerRepo.findByCompanyId).mockResolvedValue([mockCenter]);
    vi.mocked(workerRepo.findByCenterIds).mockResolvedValue([mockWorker]);
    vi.mocked(userRepo.findByIds).mockResolvedValue([mockUser]);

    const result = await useCase.execute("co1");

    expect(centerRepo.findByCompanyId).toHaveBeenCalledWith("co1");
    expect(workerRepo.findByCenterIds).toHaveBeenCalledWith(["c1"]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      worker: mockWorker,
      userName: "Juan",
      userLastName: "García",
      userEmail: "juan@test.com",
      centerName: "Oficina Central",
    });
  });

  it("returns empty array when company has no centers", async () => {
    vi.mocked(centerRepo.findByCompanyId).mockResolvedValue([]);

    const result = await useCase.execute("co1");

    expect(result).toEqual([]);
    expect(workerRepo.findByCenterIds).not.toHaveBeenCalled();
  });

  it("returns empty array when company centers have no workers", async () => {
    vi.mocked(centerRepo.findByCompanyId).mockResolvedValue([mockCenter]);
    vi.mocked(workerRepo.findByCenterIds).mockResolvedValue([]);

    const result = await useCase.execute("co1");

    expect(result).toEqual([]);
    expect(userRepo.findByIds).not.toHaveBeenCalled();
  });

  it("handles missing user gracefully", async () => {
    vi.mocked(centerRepo.findByCompanyId).mockResolvedValue([mockCenter]);
    vi.mocked(workerRepo.findByCenterIds).mockResolvedValue([mockWorker]);
    vi.mocked(userRepo.findByIds).mockResolvedValue([]);

    const result = await useCase.execute("co1");

    expect(result[0].userName).toBe("");
    expect(result[0].userLastName).toBe("");
    expect(result[0].userEmail).toBe("");
  });
});
