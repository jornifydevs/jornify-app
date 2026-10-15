import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import type { Worker } from "@/core/domain/entities";
import {
  NotFoundError,
  ValidationError,
} from "@/core/domain/errors/domain-errors";

export class MoveWorkerUseCase {
  constructor(private workerRepo: WorkerRepository) {}

  async execute(workerId: string, centerId: string): Promise<Worker> {
    if (!centerId) {
      throw new ValidationError("El centro de destino es obligatorio");
    }

    const worker = await this.workerRepo.findById(workerId);
    if (!worker) {
      throw new NotFoundError("Trabajador");
    }

    if (worker.centerId === centerId) {
      throw new ValidationError("El trabajador ya pertenece a ese centro");
    }

    return this.workerRepo.updateCenter(workerId, centerId);
  }
}
