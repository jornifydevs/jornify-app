export type ShiftSwapStatus =
  | "pending"
  | "awaiting_admin"
  | "approved"
  | "rejected"
  | "cancelled";

export interface ShiftSwapRequest {
  id: string;
  requesterId: string;
  targetId: string;
  requesterWorkdayId: string;
  targetWorkdayId: string;
  centerId: string;
  status: ShiftSwapStatus;
  requesterNote?: string;
  adminNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}
