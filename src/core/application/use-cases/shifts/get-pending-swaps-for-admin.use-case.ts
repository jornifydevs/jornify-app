import type { ShiftSwapRequestRepository } from "../../../domain/ports/repositories/shift-swap-request.repository";
import type { ShiftSwapRequest } from "../../../domain/entities";

export class GetPendingSwapsForAdminUseCase {
  constructor(private swapRepo: ShiftSwapRequestRepository) {}

  async execute(centerId: string): Promise<ShiftSwapRequest[]> {
    return this.swapRepo.findPendingByCenterId(centerId);
  }
}
