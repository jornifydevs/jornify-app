import type { ShiftSwapRequestRepository } from "../../../domain/ports/repositories/shift-swap-request.repository";
import type { WorkdayRepository } from "../../../domain/ports/repositories/workday.repository";
import type { ShiftSwapRequest } from "../../../domain/entities";
import type { ReviewShiftSwapInput } from "../../dtos/shifts.dto";
import {
  NotFoundError,
  ValidationError,
} from "../../../domain/errors/domain-errors";

export class ReviewShiftSwapUseCase {
  constructor(
    private swapRepo: ShiftSwapRequestRepository,
    private workdayRepo: WorkdayRepository
  ) {}

  async execute(input: ReviewShiftSwapInput): Promise<ShiftSwapRequest> {
    const swap = await this.swapRepo.findById(input.swapRequestId);
    if (!swap) {
      throw new NotFoundError("Solicitud de cambio");
    }

    if (swap.status !== "awaiting_admin") {
      throw new ValidationError("Esta solicitud no está pendiente de revisión");
    }

    if (input.approve) {
      const requesterWorkday = await this.workdayRepo.findById(
        swap.requesterWorkdayId
      );
      if (!requesterWorkday) {
        throw new NotFoundError("Turno del solicitante");
      }

      const targetWorkday = await this.workdayRepo.findById(
        swap.targetWorkdayId
      );
      if (!targetWorkday) {
        throw new NotFoundError("Turno del destinatario");
      }

      if (requesterWorkday.centerId !== targetWorkday.centerId) {
        throw new ValidationError(
          "Los turnos ya no pertenecen al mismo centro"
        );
      }

      await this.workdayRepo.updateWorkerId(
        swap.requesterWorkdayId,
        swap.targetId
      );
      await this.workdayRepo.updateWorkerId(
        swap.targetWorkdayId,
        swap.requesterId
      );
    }

    return this.swapRepo.update(input.swapRequestId, {
      status: input.approve ? "approved" : "rejected",
      adminNote: input.adminNote,
      reviewedBy: input.reviewedBy,
      reviewedAt: new Date().toISOString(),
    });
  }
}
