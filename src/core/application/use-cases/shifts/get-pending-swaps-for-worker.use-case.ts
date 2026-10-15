import type { ShiftSwapRequestRepository } from "../../../domain/ports/repositories/shift-swap-request.repository";
import type { ShiftSwapRequest } from "../../../domain/entities";

export class GetPendingSwapsForWorkerUseCase {
  constructor(private swapRepo: ShiftSwapRequestRepository) {}

  async execute(workerId: string): Promise<ShiftSwapRequest[]> {
    return this.swapRepo.findByWorkerId(workerId);
  }
}
