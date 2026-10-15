import type { ShiftSwapRequestRepository } from "../../../domain/ports/repositories/shift-swap-request.repository";
import type { ShiftSwapRequest } from "../../../domain/entities";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../../domain/errors/domain-errors";

export class RespondToSwapRequestUseCase {
  constructor(private swapRepo: ShiftSwapRequestRepository) {}

  async execute(
    swapRequestId: string,
    targetId: string,
    accept: boolean
  ): Promise<ShiftSwapRequest> {
    const swap = await this.swapRepo.findById(swapRequestId);
    if (!swap) {
      throw new NotFoundError("Solicitud de cambio");
    }

    if (swap.targetId !== targetId) {
      throw new UnauthorizedError("No eres el destinatario de esta solicitud");
    }

    if (swap.status !== "pending") {
      throw new ValidationError("Esta solicitud ya no está pendiente");
    }

    const newStatus = accept ? "awaiting_admin" : "rejected";
    return this.swapRepo.update(swapRequestId, { status: newStatus });
  }
}
