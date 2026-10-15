import type { ShiftSwapRequest, ShiftSwapStatus } from "../../entities";

export interface CreateShiftSwapRequestData {
  requesterId: string;
  targetId: string;
  requesterWorkdayId: string;
  targetWorkdayId: string;
  centerId: string;
  requesterNote?: string;
}

export interface UpdateShiftSwapRequestData {
  status?: ShiftSwapStatus;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export interface ShiftSwapRequestRepository {
  findById(id: string): Promise<ShiftSwapRequest | null>;
  findByWorkerId(workerId: string): Promise<ShiftSwapRequest[]>;
  findPendingByWorkdayId(workdayId: string): Promise<ShiftSwapRequest | null>;
  findPendingByCenterId(centerId: string): Promise<ShiftSwapRequest[]>;
  findHistoryByWorkerId(workerId: string): Promise<ShiftSwapRequest[]>;
  create(data: CreateShiftSwapRequestData): Promise<ShiftSwapRequest>;
  update(
    id: string,
    data: UpdateShiftSwapRequestData
  ): Promise<ShiftSwapRequest>;
}
