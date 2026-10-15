import { describe, it, expect, vi, beforeEach } from "vitest";
import { CancelShiftSwapUseCase } from "@/core/application/use-cases/shifts/cancel-shift-swap.use-case";
import type { ShiftSwapRequestRepository } from "@/core/domain/ports/repositories/shift-swap-request.repository";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/core/domain/errors/domain-errors";
import type { ShiftSwapRequest } from "@/core/domain/entities";

const pendingSwap: ShiftSwapRequest = {
  id: "swap-1",
  requesterId: "worker-1",
  targetId: "worker-2",
  requesterWorkdayId: "wd-requester",
  targetWorkdayId: "wd-target",
  centerId: "center-1",
  status: "pending",
};

describe("CancelShiftSwapUseCase", () => {
  let swapRepo: ShiftSwapRequestRepository;
  let useCase: CancelShiftSwapUseCase;

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
    useCase = new CancelShiftSwapUseCase(swapRepo);
  });

  it("cancels a pending swap successfully", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue(pendingSwap);
    vi.mocked(swapRepo.update).mockResolvedValue({
      ...pendingSwap,
      status: "cancelled",
    });

    await useCase.execute("swap-1", "worker-1");

    expect(swapRepo.update).toHaveBeenCalledWith("swap-1", {
      status: "cancelled",
    });
  });

  it("throws NotFoundError when swap does not exist", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute("swap-1", "worker-1")).rejects.toThrow(
      NotFoundError
    );
  });

  it("throws UnauthorizedError when caller is not the requester", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue(pendingSwap);

    await expect(useCase.execute("swap-1", "worker-2")).rejects.toThrow(
      UnauthorizedError
    );
  });

  it("throws ValidationError when swap is not in pending status", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue({
      ...pendingSwap,
      status: "awaiting_admin",
    });

    await expect(useCase.execute("swap-1", "worker-1")).rejects.toThrow(
      ValidationError
    );
  });

  it("throws ValidationError when swap is already cancelled", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue({
      ...pendingSwap,
      status: "cancelled",
    });

    await expect(useCase.execute("swap-1", "worker-1")).rejects.toThrow(
      ValidationError
    );
  });

  it("throws ValidationError when swap is already approved", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue({
      ...pendingSwap,
      status: "approved",
    });

    await expect(useCase.execute("swap-1", "worker-1")).rejects.toThrow(
      ValidationError
    );
  });
});
