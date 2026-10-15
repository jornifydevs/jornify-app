import { describe, it, expect, vi, beforeEach } from "vitest";
import { RequestShiftSwapUseCase } from "@/core/application/use-cases/shifts/request-shift-swap.use-case";
import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";
import type { ShiftSwapRequestRepository } from "@/core/domain/ports/repositories/shift-swap-request.repository";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/core/domain/errors/domain-errors";
import type { Workday, ShiftSwapRequest } from "@/core/domain/entities";

const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

const requesterWorkday: Workday = {
  id: "wd-requester",
  workerId: "worker-1",
  centerId: "center-1",
  day: tomorrow,
  typeDay: "normal",
  startWorkday: "08:00:00",
  endWorkday: "16:00:00",
};

const targetWorkday: Workday = {
  id: "wd-target",
  workerId: "worker-2",
  centerId: "center-1",
  day: tomorrow,
  typeDay: "normal",
  startWorkday: "16:00:00",
  endWorkday: "00:00:00",
};

const targetWorkdayOtherCenter: Workday = {
  ...targetWorkday,
  centerId: "center-2",
};

const mockSwapRequest: ShiftSwapRequest = {
  id: "swap-1",
  requesterId: "worker-1",
  targetId: "worker-2",
  requesterWorkdayId: "wd-requester",
  targetWorkdayId: "wd-target",
  centerId: "center-1",
  status: "pending",
  createdAt: new Date().toISOString(),
};

const validInput = {
  requesterId: "worker-1",
  targetId: "worker-2",
  requesterWorkdayId: "wd-requester",
  targetWorkdayId: "wd-target",
};

describe("RequestShiftSwapUseCase", () => {
  let workdayRepo: WorkdayRepository;
  let swapRepo: ShiftSwapRequestRepository;
  let useCase: RequestShiftSwapUseCase;

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
    swapRepo = {
      findById: vi.fn(),
      findByWorkerId: vi.fn(),
      findPendingByWorkdayId: vi.fn(),
      findPendingByCenterId: vi.fn(),
      findHistoryByWorkerId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    useCase = new RequestShiftSwapUseCase(workdayRepo, swapRepo);
  });

  it("creates swap request successfully when both workers are in the same center", async () => {
    vi.mocked(workdayRepo.findById)
      .mockResolvedValueOnce(requesterWorkday)
      .mockResolvedValueOnce(targetWorkday);
    vi.mocked(swapRepo.findPendingByWorkdayId).mockResolvedValue(null);
    vi.mocked(swapRepo.create).mockResolvedValue(mockSwapRequest);

    const result = await useCase.execute(validInput);

    expect(result).toEqual(mockSwapRequest);
    expect(swapRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterId: "worker-1",
        targetId: "worker-2",
        centerId: "center-1",
      })
    );
  });

  it("throws ValidationError when requester and target are the same worker", async () => {
    await expect(
      useCase.execute({ ...validInput, targetId: "worker-1" })
    ).rejects.toThrow(ValidationError);
  });

  it("throws NotFoundError when requester workday does not exist", async () => {
    vi.mocked(workdayRepo.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute(validInput)).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when target workday does not exist", async () => {
    vi.mocked(workdayRepo.findById)
      .mockResolvedValueOnce(requesterWorkday)
      .mockResolvedValueOnce(null);

    await expect(useCase.execute(validInput)).rejects.toThrow(NotFoundError);
  });

  it("throws UnauthorizedError when requester workday does not belong to requester", async () => {
    vi.mocked(workdayRepo.findById)
      .mockResolvedValueOnce({ ...requesterWorkday, workerId: "worker-other" })
      .mockResolvedValueOnce(targetWorkday);

    await expect(useCase.execute(validInput)).rejects.toThrow(
      UnauthorizedError
    );
  });

  it("throws ValidationError when target workday does not belong to target worker", async () => {
    vi.mocked(workdayRepo.findById)
      .mockResolvedValueOnce(requesterWorkday)
      .mockResolvedValueOnce({ ...targetWorkday, workerId: "worker-other" });

    await expect(useCase.execute(validInput)).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when workers are from different centers", async () => {
    vi.mocked(workdayRepo.findById)
      .mockResolvedValueOnce(requesterWorkday)
      .mockResolvedValueOnce(targetWorkdayOtherCenter);

    await expect(useCase.execute(validInput)).rejects.toThrow(
      new ValidationError(
        "Solo se pueden intercambiar turnos dentro del mismo centro"
      )
    );
  });

  it("throws ValidationError when requester workday date is in the past", async () => {
    vi.mocked(workdayRepo.findById)
      .mockResolvedValueOnce({ ...requesterWorkday, day: "2020-01-01" })
      .mockResolvedValueOnce(targetWorkday);

    await expect(useCase.execute(validInput)).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when target workday date is in the past", async () => {
    vi.mocked(workdayRepo.findById)
      .mockResolvedValueOnce(requesterWorkday)
      .mockResolvedValueOnce({ ...targetWorkday, day: "2020-01-01" });

    await expect(useCase.execute(validInput)).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when requester workday already has a pending swap", async () => {
    vi.mocked(workdayRepo.findById)
      .mockResolvedValueOnce(requesterWorkday)
      .mockResolvedValueOnce(targetWorkday);
    vi.mocked(swapRepo.findPendingByWorkdayId).mockResolvedValueOnce(
      mockSwapRequest
    );

    await expect(useCase.execute(validInput)).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when target workday already has a pending swap", async () => {
    vi.mocked(workdayRepo.findById)
      .mockResolvedValueOnce(requesterWorkday)
      .mockResolvedValueOnce(targetWorkday);
    vi.mocked(swapRepo.findPendingByWorkdayId)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(mockSwapRequest);

    await expect(useCase.execute(validInput)).rejects.toThrow(ValidationError);
  });
});
