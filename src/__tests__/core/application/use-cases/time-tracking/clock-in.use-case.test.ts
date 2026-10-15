import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClockInUseCase } from "@/core/application/use-cases/time-tracking/clock-in.use-case";
import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";
import type { TimeRecordRepository } from "@/core/domain/ports/repositories/time-record.repository";
import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import { NotFoundError, ClockError } from "@/core/domain/errors/domain-errors";
import type {
  Worker,
  Workday,
  TimeRecord,
  Center,
} from "@/core/domain/entities";

const mockWorker: Worker = {
  id: "worker-1",
  userId: "user-1",
  centerId: "center-1",
  dni: "12345678A",
  contractType: "full_time",
  hourWeek: 40,
  job: "Developer",
};

const mockCenter: Center = {
  id: "center-1",
  companyId: "company-1",
  name: "Oficina Central",
  address: "Calle Test 1",
  enabledFeatures: ["break"],
  allowedDayTypes: ["normal", "vacation"],
  defaultStartWorkday: "08:00:00",
  defaultEndWorkday: "17:00:00",
  breakType: "free",
  defaultStartBreak: undefined,
  defaultEndBreak: undefined,
};

// Workday with start at 08:00 — tests that check time window set fake time to 08:00+
const mockWorkday: Workday = {
  id: "workday-1",
  workerId: "worker-1",
  centerId: "center-1",
  day: new Date().toISOString().split("T")[0],
  typeDay: "normal",
  startWorkday: "08:00:00",
  endWorkday: "17:00:00",
  breakType: "free",
};

const mockTimeRecord: TimeRecord = {
  id: "record-1",
  workdayId: "workday-1",
  startHour: new Date().toISOString(),
};

const yesterdayWorkday: Workday = {
  id: "workday-yesterday",
  workerId: "worker-1",
  centerId: "center-1",
  day: (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split("T")[0];
  })(),
  typeDay: "normal",
  startWorkday: "08:00:00",
  endWorkday: "17:00:00",
  breakType: "free",
};

const openPreviousRecord: TimeRecord = {
  id: "record-open",
  workdayId: "workday-yesterday",
  startHour: new Date(Date.now() - 86400000).toISOString(),
  // endHour undefined — still open
};

describe("ClockInUseCase", () => {
  let workdayRepo: WorkdayRepository;
  let timeRecordRepo: TimeRecordRepository;
  let workerRepo: WorkerRepository;
  let centerRepo: CenterRepository;
  let useCase: ClockInUseCase;

  beforeEach(() => {
    workdayRepo = {
      findByWorkerAndDate: vi.fn(),
      findByWorkerInDateRange: vi.fn().mockResolvedValue([]),
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
      findOpenByWorkdayIds: vi.fn().mockResolvedValue(null),
      findCompletedByWorkdayIds: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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
    useCase = new ClockInUseCase(
      workdayRepo,
      timeRecordRepo,
      workerRepo,
      centerRepo
    );
  });

  it("creates a new workday and time record when no workday exists", async () => {
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(null);
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(centerRepo.findById).mockResolvedValue(mockCenter);
    vi.mocked(workdayRepo.create).mockResolvedValue(mockWorkday);
    vi.mocked(timeRecordRepo.findActiveByWorkdayId).mockResolvedValue(null);
    vi.mocked(timeRecordRepo.create).mockResolvedValue(mockTimeRecord);

    const result = await useCase.execute("worker-1");

    expect(workdayRepo.create).toHaveBeenCalled();
    expect(timeRecordRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ workdayId: "workday-1" })
    );
    expect(result.workday).toEqual(mockWorkday);
    expect(result.timeRecord).toEqual(mockTimeRecord);
  });

  it("uses center schedule defaults when creating workday", async () => {
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(null);
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(centerRepo.findById).mockResolvedValue(mockCenter);
    vi.mocked(workdayRepo.create).mockResolvedValue(mockWorkday);
    vi.mocked(timeRecordRepo.findActiveByWorkdayId).mockResolvedValue(null);
    vi.mocked(timeRecordRepo.create).mockResolvedValue(mockTimeRecord);

    await useCase.execute("worker-1");

    expect(workdayRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        startWorkday: "08:00:00",
        endWorkday: "17:00:00",
        breakType: "free",
      })
    );
  });

  it("copies break schedule to workday when center has scheduled breaks", async () => {
    const scheduledCenter: Center = {
      ...mockCenter,
      breakType: "scheduled",
      defaultStartBreak: "13:00:00",
      defaultEndBreak: "14:00:00",
    };

    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(null);
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(centerRepo.findById).mockResolvedValue(scheduledCenter);
    vi.mocked(workdayRepo.create).mockResolvedValue(mockWorkday);
    vi.mocked(timeRecordRepo.findActiveByWorkdayId).mockResolvedValue(null);
    vi.mocked(timeRecordRepo.create).mockResolvedValue(mockTimeRecord);

    await useCase.execute("worker-1");

    expect(workdayRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        breakType: "scheduled",
        scheduledStartBreak: "13:00:00",
        scheduledEndBreak: "14:00:00",
      })
    );
  });

  it("reuses existing workday when one exists for today", async () => {
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(mockWorkday);
    vi.mocked(timeRecordRepo.findActiveByWorkdayId).mockResolvedValue(null);
    vi.mocked(timeRecordRepo.create).mockResolvedValue(mockTimeRecord);

    const result = await useCase.execute("worker-1");

    expect(workdayRepo.create).not.toHaveBeenCalled();
    expect(result.workday).toEqual(mockWorkday);
    expect(result.timeRecord).toEqual(mockTimeRecord);
  });

  it("throws NotFoundError when worker does not exist", async () => {
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(null);
    vi.mocked(workerRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute("nonexistent")).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when center does not exist", async () => {
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(null);
    vi.mocked(workerRepo.findById).mockResolvedValue(mockWorker);
    vi.mocked(centerRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute("worker-1")).rejects.toThrow(NotFoundError);
  });

  it("throws ClockError when there is already an active record", async () => {
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(mockWorkday);
    vi.mocked(timeRecordRepo.findActiveByWorkdayId).mockResolvedValue(
      mockTimeRecord
    );

    await expect(useCase.execute("worker-1")).rejects.toThrow(ClockError);
  });

  // --- Open previous record validation ---

  it("throws ClockError when there is an unclosed record from a previous day", async () => {
    vi.mocked(workdayRepo.findByWorkerInDateRange).mockResolvedValue([
      yesterdayWorkday,
    ]);
    vi.mocked(timeRecordRepo.findOpenByWorkdayIds).mockResolvedValue(
      openPreviousRecord
    );

    await expect(useCase.execute("worker-1")).rejects.toThrow(
      new ClockError(
        "Tienes un fichaje de entrada sin cerrar de un día anterior"
      )
    );
  });

  it("does not query open records when there are no recent workdays", async () => {
    vi.mocked(workdayRepo.findByWorkerInDateRange).mockResolvedValue([]);
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(mockWorkday);
    vi.mocked(timeRecordRepo.findActiveByWorkdayId).mockResolvedValue(null);
    vi.mocked(timeRecordRepo.create).mockResolvedValue(mockTimeRecord);

    await useCase.execute("worker-1");

    expect(timeRecordRepo.findOpenByWorkdayIds).not.toHaveBeenCalled();
  });

  // --- Time window validation ---

  it("throws ClockError when clocking in more than 30 min before workday start", async () => {
    // Workday starts at 08:00, current time is 07:00 local (60 min before)
    const earlyNow = new Date(2025, 0, 15, 7, 0, 0);
    const earlyWorkday: Workday = { ...mockWorkday, startWorkday: "08:00:00" };
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(earlyWorkday);

    await expect(useCase.execute("worker-1", earlyNow)).rejects.toThrow(
      new ClockError(
        "No puedes fichar antes de 30 minutos del inicio de tu jornada"
      )
    );
  });

  it("allows clocking in exactly 30 min before workday start", async () => {
    // Workday starts at 08:00, current time is 07:30 local (exactly 30 min before)
    const exactNow = new Date(2025, 0, 15, 7, 30, 0);
    const workday: Workday = { ...mockWorkday, startWorkday: "08:00:00" };
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(workday);
    vi.mocked(timeRecordRepo.findActiveByWorkdayId).mockResolvedValue(null);
    vi.mocked(timeRecordRepo.create).mockResolvedValue(mockTimeRecord);

    await expect(useCase.execute("worker-1", exactNow)).resolves.toBeDefined();
  });

  it("allows clocking in after workday start", async () => {
    // Workday starts at 08:00, current time is 09:00 local
    const laterNow = new Date(2025, 0, 15, 9, 0, 0);
    vi.mocked(workdayRepo.findByWorkerAndDate).mockResolvedValue(mockWorkday);
    vi.mocked(timeRecordRepo.findActiveByWorkdayId).mockResolvedValue(null);
    vi.mocked(timeRecordRepo.create).mockResolvedValue(mockTimeRecord);

    await expect(useCase.execute("worker-1", laterNow)).resolves.toBeDefined();
  });
});
