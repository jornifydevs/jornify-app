import type { ShiftSwapRequestRepository } from "../../../domain/ports/repositories/shift-swap-request.repository";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../../domain/errors/domain-errors";

export class CancelShiftSwapUseCase {
  constructor(private swapRepo: ShiftSwapRequestRepository) {}

  async execute(swapRequestId: string, requesterId: string): Promise<void> {
    const swap = await this.swapRepo.findById(swapRequestId);
    if (!swap) {
      throw new NotFoundError("Solicitud de cambio");
    }

    if (swap.requesterId !== requesterId) {
      throw new UnauthorizedError(
        "Solo el solicitante puede cancelar la solicitud"
      );
    }

    if (swap.status !== "pending") {
      throw new ValidationError(
        "Solo se pueden cancelar solicitudes pendientes"
      );
    }

    await this.swapRepo.update(swapRequestId, { status: "cancelled" });
  }
}
