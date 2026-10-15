import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetPendingSwapsForAdminUseCase } from "@/core/application/use-cases/shifts/get-pending-swaps-for-admin.use-case";
import type { ShiftSwapRequestRepository } from "@/core/domain/ports/repositories/shift-swap-request.repository";
import type { ShiftSwapRequest } from "@/core/domain/entities";

const awaitingSwaps: ShiftSwapRequest[] = [
  {
    id: "swap-1",
    requesterId: "worker-1",
    targetId: "worker-2",
    requesterWorkdayId: "wd-1",
    targetWorkdayId: "wd-2",
    centerId: "center-1",
    status: "awaiting_admin",
  },
  {
    id: "swap-2",
    requesterId: "worker-3",
    targetId: "worker-4",
    requesterWorkdayId: "wd-3",
    targetWorkdayId: "wd-4",
    centerId: "center-1",
    status: "awaiting_admin",
  },
];

describe("GetPendingSwapsForAdminUseCase", () => {
  let swapRepo: ShiftSwapRequestRepository;
  let useCase: GetPendingSwapsForAdminUseCase;

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
    useCase = new GetPendingSwapsForAdminUseCase(swapRepo);
  });

  it("returns awaiting_admin swaps for a center", async () => {
    vi.mocked(swapRepo.findPendingByCenterId).mockResolvedValue(awaitingSwaps);

    const result = await useCase.execute("center-1");

    expect(result).toEqual(awaitingSwaps);
    expect(swapRepo.findPendingByCenterId).toHaveBeenCalledWith("center-1");
  });

  it("returns empty array when no swaps are awaiting admin review", async () => {
    vi.mocked(swapRepo.findPendingByCenterId).mockResolvedValue([]);

    const result = await useCase.execute("center-1");

    expect(result).toEqual([]);
  });
});
