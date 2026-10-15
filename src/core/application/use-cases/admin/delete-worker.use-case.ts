import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import { NotFoundError } from "@/core/domain/errors/domain-errors";

export class DeleteWorkerUseCase {
  constructor(private workerRepo: WorkerRepository) {}

  async execute(workerId: string): Promise<void> {
    const worker = await this.workerRepo.findById(workerId);
    if (!worker) {
      throw new NotFoundError("Trabajador");
    }

    await this.workerRepo.delete(workerId);
  }
}
