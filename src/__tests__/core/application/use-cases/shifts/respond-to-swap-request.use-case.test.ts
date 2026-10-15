import { describe, it, expect, vi, beforeEach } from "vitest";
import { RespondToSwapRequestUseCase } from "@/core/application/use-cases/shifts/respond-to-swap-request.use-case";
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

describe("RespondToSwapRequestUseCase", () => {
  let swapRepo: ShiftSwapRequestRepository;
  let useCase: RespondToSwapRequestUseCase;

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
    useCase = new RespondToSwapRequestUseCase(swapRepo);
  });

  it("sets status to awaiting_admin when target accepts", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue(pendingSwap);
    vi.mocked(swapRepo.update).mockResolvedValue({
      ...pendingSwap,
      status: "awaiting_admin",
    });

    const result = await useCase.execute("swap-1", "worker-2", true);

    expect(result.status).toBe("awaiting_admin");
    expect(swapRepo.update).toHaveBeenCalledWith("swap-1", {
      status: "awaiting_admin",
    });
  });

  it("sets status to rejected when target rejects", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue(pendingSwap);
    vi.mocked(swapRepo.update).mockResolvedValue({
      ...pendingSwap,
      status: "rejected",
    });

    const result = await useCase.execute("swap-1", "worker-2", false);

    expect(result.status).toBe("rejected");
    expect(swapRepo.update).toHaveBeenCalledWith("swap-1", {
      status: "rejected",
    });
  });

  it("throws NotFoundError when swap does not exist", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue(null);

    await expect(useCase.execute("swap-1", "worker-2", true)).rejects.toThrow(
      NotFoundError
    );
  });

  it("throws UnauthorizedError when caller is not the target", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue(pendingSwap);

    await expect(
      useCase.execute("swap-1", "worker-other", true)
    ).rejects.toThrow(UnauthorizedError);
  });

  it("throws ValidationError when swap is not in pending status", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue({
      ...pendingSwap,
      status: "awaiting_admin",
    });

    await expect(useCase.execute("swap-1", "worker-2", true)).rejects.toThrow(
      ValidationError
    );
  });

  it("throws ValidationError when swap is already approved", async () => {
    vi.mocked(swapRepo.findById).mockResolvedValue({
      ...pendingSwap,
      status: "approved",
    });

    await expect(useCase.execute("swap-1", "worker-2", false)).rejects.toThrow(
      ValidationError
    );
  });
});
