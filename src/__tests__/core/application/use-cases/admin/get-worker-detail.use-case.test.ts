import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetWorkerDetailUseCase } from "@/core/application/use-cases/admin/get-worker-detail.use-case";
import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import type { UserRepository } from "@/core/domain/ports/repositories/user.repository";
import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";
import type { TimeRecordRepository } from "@/core/domain/ports/repositories/time-record.repository";
import {
  NotFoundError,
  UnauthorizedError,
} from "@/core/domain/errors/domain-errors";
import type {
  Worker,
  User,
  Center,
  Workday,
  TimeRecord,
} from "@/core/domain/entities";

describe("GetWorkerDetailUseCase", () => {
  let workerRepo: WorkerRepository;
  let userRepo: UserRepository;
  let centerRepo: CenterRepository;
  let workdayRepo: WorkdayRepository;
  let timeRecordRepo: TimeRecordRepository;
  let useCase: GetWorkerDetailUseCase;

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
    phone: "666111222",
    role: "worker",
  };

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

  const mockWorkday: Workday = {
    id: "wd1",
    workerId: "w1",
    centerId: "c1",
    day: "2025-01-15",
    typeDay: "normal",
    startWorkday: "09:00",
    endWorkday: "17:00",
  };

  const mockTimeRecord: TimeRecord = {
    id: "tr1",
    workdayId: "wd1",
    startHour: "2025-01-15T09:00:00",
    endHour: "2025-01-15T17:00:00",
    totalHour: "08:00:00",
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
      updateCenter: vi.fn(),
      delete: vi.fn(),
    };
    userRepo = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findWorkersByCompanyId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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
      findIdsByWorkerId: vi.fn(),
      deleteAllByWorkerId: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      updateWorkerId: vi.fn(),
    };
    timeRecordRepo = {
      findActiveByWorkdayId: vi.fn(),
      findCompletedByWorkdayIds: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findOpenByWorkdayIds: vi.fn(),
      deleteAllByWorkdayIds: vi.fn(),
    };
    useCase = new GetWorkerDetailUseCase(
      workerRepo,
      userRepo,
      centerRepo,
      workdayRepo,
      timeRecordRepo
    );
  });

  it("returns full worker detail with recent records", async () => {
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(centerRepo.findById).mockResolvedValue(mockCenter);
    vi.mocked(userRepo.findById).mockResolvedValue(mockUser);
    vi.mocked(workdayRepo.findByWorkerInDateRange).mockResolvedValue([
      mockWorkday,
    ]);
    vi.mocked(timeRecordRepo.findCompletedByWorkdayIds).mockResolvedValue([
      mockTimeRecord,
    ]);

    const result = await useCase.execute("w1", "co1");

    expect(result.worker).toEqual(mockWorker);
    expect(result.userName).toBe("Juan");
    expect(result.userLastName).toBe("García");
    expect(result.centerName).toBe("Oficina Central");
    expect(result.recentRecords).toHaveLength(1);
    expect(result.recentRecords[0].startHour).toBe("2025-01-15T09:00:00");
    expect(result.recentRecords[0].totalHour).toBe("08:00:00");
  });

  it("throws NotFoundError when worker does not exist", async () => {
    vi.mocked(workerRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute("nonexistent", "co1")).rejects.toThrow(
      NotFoundError
    );
  });

  it("throws UnauthorizedError when worker belongs to a different company", async () => {
    const otherCenter: Center = { ...mockCenter, companyId: "other-company" };
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(centerRepo.findById).mockResolvedValue(otherCenter);

    await expect(useCase.execute("w1", "co1")).rejects.toThrow(
      UnauthorizedError
    );
  });

  it("throws UnauthorizedError when center not found", async () => {
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(centerRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute("w1", "co1")).rejects.toThrow(
      UnauthorizedError
    );
  });

  it("throws NotFoundError when user does not exist", async () => {
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(centerRepo.findById).mockResolvedValue(mockCenter);
    vi.mocked(userRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute("w1", "co1")).rejects.toThrow(NotFoundError);
  });

  it("returns empty records when no workdays exist", async () => {
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(centerRepo.findById).mockResolvedValue(mockCenter);
    vi.mocked(userRepo.findById).mockResolvedValue(mockUser);
    vi.mocked(workdayRepo.findByWorkerInDateRange).mockResolvedValue([]);

    const result = await useCase.execute("w1", "co1");

    expect(result.recentRecords).toEqual([]);
    expect(timeRecordRepo.findCompletedByWorkdayIds).not.toHaveBeenCalled();
  });
});
