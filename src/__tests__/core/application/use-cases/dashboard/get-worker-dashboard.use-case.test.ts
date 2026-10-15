import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetWorkerDashboardUseCase } from "@/core/application/use-cases/dashboard/get-worker-dashboard.use-case";
import type { UserRepository } from "@/core/domain/ports/repositories/user.repository";
import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import { NotFoundError } from "@/core/domain/errors/domain-errors";
import type { User, Worker } from "@/core/domain/entities";

const mockUser: User = {
  id: "user-1",
  name: "Juan",
  lastName: "Garcia",
  email: "juan@example.com",
  role: "worker",
};

const mockWorker: Worker = {
  id: "worker-1",
  userId: "user-1",
  centerId: "center-1",
  dni: "12345678A",
  contractType: "full_time",
  hourWeek: 40,
  job: "Developer",
};

describe("GetWorkerDashboardUseCase", () => {
  let userRepo: UserRepository;
  let workerRepo: WorkerRepository;
  let useCase: GetWorkerDashboardUseCase;

  beforeEach(() => {
    userRepo = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findWorkersByCompanyId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    workerRepo = {
      findById: vi.fn(),
      findByUserId: vi.fn(),
      findAll: vi.fn(),
      findByCenterId: vi.fn(),
      findByCenterIds: vi.fn(),
      countAll: vi.fn(),
      create: vi.fn(),
    };
    useCase = new GetWorkerDashboardUseCase(userRepo, workerRepo);
  });

  it("returns user and worker data when both exist", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(mockUser);
    vi.mocked(workerRepo.findByUserId).mockResolvedValue(mockWorker);

    const result = await useCase.execute("juan@example.com");

    expect(result.user).toEqual(mockUser);
    expect(result.worker).toEqual(mockWorker);
  });

  it("throws NotFoundError when user does not exist", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(null);

    await expect(useCase.execute("nonexistent@example.com")).rejects.toThrow(
      NotFoundError
    );
  });

  it("throws NotFoundError when worker does not exist for user", async () => {
    vi.mocked(userRepo.findByEmail).mockResolvedValue(mockUser);
    vi.mocked(workerRepo.findByUserId).mockResolvedValue(null);

    await expect(useCase.execute("juan@example.com")).rejects.toThrow(
      NotFoundError
    );
  });
});
