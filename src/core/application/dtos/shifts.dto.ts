export interface RequestShiftSwapInput {
  requesterId: string;
  targetId: string;
  requesterWorkdayId: string;
  targetWorkdayId: string;
  requesterNote?: string;
}

export interface ReviewShiftSwapInput {
  swapRequestId: string;
  adminNote?: string;
  reviewedBy: string;
  approve: boolean;
}

export interface UpdateShiftInput {
  startWorkday: string;
  endWorkday: string;
  shift?: string;
  breakType?: string;
  scheduledStartBreak?: string;
  scheduledEndBreak?: string;
}
