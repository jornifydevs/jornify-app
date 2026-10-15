import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetAttendanceReportUseCase } from "@/core/application/use-cases/admin/get-attendance-report.use-case";
import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";
import type { TimeRecordRepository } from "@/core/domain/ports/repositories/time-record.repository";
import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import type { UserRepository } from "@/core/domain/ports/repositories/user.repository";
import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import type {
  Workday,
  TimeRecord,
  Worker,
  User,
  Center,
} from "@/core/domain/entities";

describe("GetAttendanceReportUseCase", () => {
  let workdayRepo: WorkdayRepository;
  let timeRecordRepo: TimeRecordRepository;
  let workerRepo: WorkerRepository;
  let userRepo: UserRepository;
  let centerRepo: CenterRepository;
  let useCase: GetAttendanceReportUseCase;

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
    useCase = new GetAttendanceReportUseCase(
      workdayRepo,
      timeRecordRepo,
      workerRepo,
      userRepo,
      centerRepo
    );
  });

  it("returns attendance records scoped by companyId", async () => {
    vi.mocked(centerRepo.findByCompanyId).mockResolvedValue([mockCenter]);
    vi.mocked(workdayRepo.findByCenterAndDateRange).mockResolvedValue([
      mockWorkday,
    ]);
    vi.mocked(timeRecordRepo.findCompletedByWorkdayIds).mockResolvedValue([
      mockTimeRecord,
    ]);
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(userRepo.findByIds).mockResolvedValue([mockUser]);
    vi.mocked(centerRepo.findById).mockResolvedValue(mockCenter);

    const result = await useCase.execute({
      companyId: "co1",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });

    expect(centerRepo.findByCompanyId).toHaveBeenCalledWith("co1");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      workerId: "w1",
      workerName: "Juan",
      workerLastName: "García",
      centerName: "Oficina Central",
      day: "2025-01-15",
      typeDay: "normal",
      startHour: "2025-01-15T09:00:00",
      endHour: "2025-01-15T17:00:00",
      totalHour: "08:00:00",
    });
  });

  it("filters by center when centerId provided and belongs to company", async () => {
    vi.mocked(centerRepo.findByCompanyId).mockResolvedValue([mockCenter]);
    vi.mocked(workdayRepo.findByCenterAndDateRange).mockResolvedValue([
      mockWorkday,
    ]);
    vi.mocked(timeRecordRepo.findCompletedByWorkdayIds).mockResolvedValue([
      mockTimeRecord,
    ]);
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(userRepo.findByIds).mockResolvedValue([mockUser]);
    vi.mocked(centerRepo.findById).mockResolvedValue(mockCenter);

    await useCase.execute({
      companyId: "co1",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      centerId: "c1",
    });

    expect(workdayRepo.findByCenterAndDateRange).toHaveBeenCalledWith(
      "c1",
      "2025-01-01",
      "2025-01-31"
    );
  });

  it("returns empty array when centerId does not belong to company", async () => {
    vi.mocked(centerRepo.findByCompanyId).mockResolvedValue([mockCenter]);

    const result = await useCase.execute({
      companyId: "co1",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
      centerId: "other-center",
    });

    expect(result).toEqual([]);
  });

  it("returns empty array when company has no centers", async () => {
    vi.mocked(centerRepo.findByCompanyId).mockResolvedValue([]);

    const result = await useCase.execute({
      companyId: "co1",
      startDate: "2025-01-01",
      endDate: "2025-01-31",
    });

    expect(result).toEqual([]);
  });
});
