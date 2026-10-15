import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetSwapHistoryUseCase } from "@/core/application/use-cases/shifts/get-swap-history.use-case";
import type { ShiftSwapRequestRepository } from "@/core/domain/ports/repositories/shift-swap-request.repository";
import type { ShiftSwapRequest } from "@/core/domain/entities";

const history: ShiftSwapRequest[] = [
  {
    id: "swap-1",
    requesterId: "worker-1",
    targetId: "worker-2",
    requesterWorkdayId: "wd-1",
    targetWorkdayId: "wd-2",
    centerId: "center-1",
    status: "approved",
    reviewedBy: "admin-1",
    reviewedAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "swap-2",
    requesterId: "worker-1",
    targetId: "worker-3",
    requesterWorkdayId: "wd-3",
    targetWorkdayId: "wd-4",
    centerId: "center-1",
    status: "rejected",
    reviewedBy: "admin-1",
    reviewedAt: "2026-03-10T10:00:00Z",
  },
  {
    id: "swap-3",
    requesterId: "worker-1",
    targetId: "worker-4",
    requesterWorkdayId: "wd-5",
    targetWorkdayId: "wd-6",
    centerId: "center-1",
    status: "cancelled",
  },
];

describe("GetSwapHistoryUseCase", () => {
  let swapRepo: ShiftSwapRequestRepository;
  let useCase: GetSwapHistoryUseCase;

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
    useCase = new GetSwapHistoryUseCase(swapRepo);
  });

  it("returns completed swap history for a worker", async () => {
    vi.mocked(swapRepo.findHistoryByWorkerId).mockResolvedValue(history);

    const result = await useCase.execute("worker-1");

    expect(result).toEqual(history);
    expect(swapRepo.findHistoryByWorkerId).toHaveBeenCalledWith("worker-1");
  });

  it("returns empty array when worker has no swap history", async () => {
    vi.mocked(swapRepo.findHistoryByWorkerId).mockResolvedValue([]);

    const result = await useCase.execute("worker-1");

    expect(result).toEqual([]);
  });

  it("includes approved, rejected and cancelled swaps", async () => {
    vi.mocked(swapRepo.findHistoryByWorkerId).mockResolvedValue(history);

    const result = await useCase.execute("worker-1");

    const statuses = result.map((s) => s.status);
    expect(statuses).toContain("approved");
    expect(statuses).toContain("rejected");
    expect(statuses).toContain("cancelled");
  });
});
