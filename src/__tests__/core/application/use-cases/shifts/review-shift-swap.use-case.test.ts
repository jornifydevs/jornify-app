import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReviewShiftSwapUseCase } from "@/core/application/use-cases/shifts/review-shift-swap.use-case";
import type { ShiftSwapRequestRepository } from "@/core/domain/ports/repositories/shift-swap-request.repository";
import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";
import {
  NotFoundError,
  ValidationError,
} from "@/core/domain/errors/domain-errors";
import type { Workday, ShiftSwapRequest } from "@/core/domain/entities";

const pendingSwap: ShiftSwapRequest = {
  id: "swap-1",
  requesterId: "worker-1",
  targetId: "worker-2",
  requesterWorkdayId: "wd-requester",
  targetWorkdayId: "wd-target",
  centerId: "center-1",
  status: "awaiting_admin",
};

const requesterWorkday: Workday = {
  id: "wd-requester",
  workerId: "worker-1",
  centerId: "center-1",
  day: "2026-03-25",
  typeDay: "normal",
  startWorkday: "08:00:00",
  endWorkday: "16:00:00",
};

const targetWorkday: Workday = {
  id: "wd-target",
  workerId: "worker-2",
  centerId: "center-1",
  day: "2026-03-25",
  typeDay: "normal",
  startWorkday: "16:00:00",
  endWorkday: "00:00:00",
};

const approvedSwap: ShiftSwapRequest = {
  ...pendingSwap,
  status: "approved",
  reviewedBy: "admin-1",
};

const rejectedSwap: ShiftSwapRequest = {
  ...pendingSwap,
  status: "rejected",
  reviewedBy: "admin-1",
};

const approveInput = {
  swapRequestId: "swap-1",
  reviewedBy: "admin-1",
  approve: true,
};
const rejectInput = {
  swapRequestId: "swap-1",
  reviewedBy: "admin-1",
  approve: false,
};

describe("ReviewShiftSwapUseCase", () => {
  let swapRepo: ShiftSwapRequestRepository;
  let workdayRepo: WorkdayRepository;
  let useCase: ReviewShiftSwapUseCase;

  beforeEach(() => {
    swapRepo = {
      findById: vi.fn(),
      findByWorkerId: vi.fn(),
      findPendingByWorkdayId: vi.fn(),
      findPendingByCenterId: vi.fn(),
      findHistoryByWorkerId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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
    useCase = new ReviewShiftSwapUseCase(swapRepo, workdayRepo);
  });

  it("approves swap and swaps worker_ids between workdays", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue(pendingSwap);
    vi.mocked(workdayRepo.findById)
      .mockResolvedValueOnce(requesterWorkday)
      .mockResolvedValueOnce(targetWorkday);
    vi.mocked(workdayRepo.updateWorkerId).mockResolvedValue(requesterWorkday);
    vi.mocked(swapRepo.update).mockResolvedValue(approvedSwap);

    const result = await useCase.execute(approveInput);

    expect(result.status).toBe("approved");
    expect(workdayRepo.updateWorkerId).toHaveBeenCalledWith(
      "wd-requester",
      "worker-2"
    );
    expect(workdayRepo.updateWorkerId).toHaveBeenCalledWith(
      "wd-target",
      "worker-1"
    );
    expect(swapRepo.update).toHaveBeenCalledWith(
      "swap-1",
      expect.objectContaining({ status: "approved", reviewedBy: "admin-1" })
    );
  });

  it("calls updateWorkerId exactly twice on approval", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue(pendingSwap);
    vi.mocked(workdayRepo.findById)
      .mockResolvedValueOnce(requesterWorkday)
      .mockResolvedValueOnce(targetWorkday);
    vi.mocked(workdayRepo.updateWorkerId).mockResolvedValue(requesterWorkday);
    vi.mocked(swapRepo.update).mockResolvedValue(approvedSwap);

    await useCase.execute(approveInput);

    expect(workdayRepo.updateWorkerId).toHaveBeenCalledTimes(2);
  });

  it("rejects swap without modifying workdays", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue(pendingSwap);
    vi.mocked(swapRepo.update).mockResolvedValue(rejectedSwap);

    const result = await useCase.execute(rejectInput);

    expect(result.status).toBe("rejected");
    expect(workdayRepo.updateWorkerId).not.toHaveBeenCalled();
    expect(swapRepo.update).toHaveBeenCalledWith(
      "swap-1",
      expect.objectContaining({ status: "rejected" })
    );
  });

  it("throws NotFoundError when swap request does not exist", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute(approveInput)).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when swap is not in awaiting_admin status", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue({
      ...pendingSwap,
      status: "approved",
    });

    await expect(useCase.execute(approveInput)).rejects.toThrow(
      ValidationError
    );
  });

  it("throws NotFoundError when requester workday no longer exists on approval", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue(pendingSwap);
    vi.mocked(workdayRepo.findById).mockResolvedValueOnce(null);

    await expect(useCase.execute(approveInput)).rejects.toThrow(NotFoundError);
  });

  it("throws NotFoundError when target workday no longer exists on approval", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue(pendingSwap);
    vi.mocked(workdayRepo.findById)
      .mockResolvedValueOnce(requesterWorkday)
      .mockResolvedValueOnce(null);

    await expect(useCase.execute(approveInput)).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when workdays are no longer in the same center on approval", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue(pendingSwap);
    vi.mocked(workdayRepo.findById)
      .mockResolvedValueOnce(requesterWorkday)
      .mockResolvedValueOnce({ ...targetWorkday, centerId: "center-2" });

    await expect(useCase.execute(approveInput)).rejects.toThrow(
      ValidationError
    );
  });
});
