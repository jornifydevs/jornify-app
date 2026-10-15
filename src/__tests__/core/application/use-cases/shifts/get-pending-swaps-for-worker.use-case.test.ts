import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetPendingSwapsForWorkerUseCase } from "@/core/application/use-cases/shifts/get-pending-swaps-for-worker.use-case";
import type { ShiftSwapRequestRepository } from "@/core/domain/ports/repositories/shift-swap-request.repository";
import type { ShiftSwapRequest } from "@/core/domain/entities";

const swaps: ShiftSwapRequest[] = [
  {
    id: "swap-1",
    requesterId: "worker-1",
    targetId: "worker-2",
    requesterWorkdayId: "wd-1",
    targetWorkdayId: "wd-2",
    centerId: "center-1",
    status: "pending",
  },
  {
    id: "swap-2",
    requesterId: "worker-3",
    targetId: "worker-1",
    requesterWorkdayId: "wd-3",
    targetWorkdayId: "wd-4",
    centerId: "center-1",
    status: "pending",
  },
];

describe("GetPendingSwapsForWorkerUseCase", () => {
  let swapRepo: ShiftSwapRequestRepository;
  let useCase: GetPendingSwapsForWorkerUseCase;

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
    useCase = new GetPendingSwapsForWorkerUseCase(swapRepo);
  });

  it("returns swaps where worker is requester or target", async () => {
    vi.mocked(swapRepo.findByWorkerId).mockResolvedValue(swaps);

    const result = await useCase.execute("worker-1");

    expect(result).toEqual(swaps);
    expect(swapRepo.findByWorkerId).toHaveBeenCalledWith("worker-1");
  });

  it("returns empty array when worker has no pending swaps", async () => {
    vi.mocked(swapRepo.findByWorkerId).mockResolvedValue([]);

    const result = await useCase.execute("worker-1");

    expect(result).toEqual([]);
  });
});
