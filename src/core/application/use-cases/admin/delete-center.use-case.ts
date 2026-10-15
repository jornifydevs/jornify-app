import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import { ValidationError } from "@/core/domain/errors/domain-errors";

export class DeleteCenterUseCase {
  constructor(
    private centerRepo: CenterRepository,
    private workerRepo: WorkerRepository
  ) {}

  async execute(id: string, companyId: string): Promise<void> {
    const center = await this.centerRepo.findById(id);

    if (!center || center.companyId !== companyId) {
      throw new ValidationError("Centro no encontrado");
    }

    const workers = await this.workerRepo.findByCenterId(id);

    if (workers.length > 0) {
      throw new ValidationError(
        "No se puede eliminar un centro con trabajadores asignados"
      );
    }

    await this.centerRepo.delete(id);
  }
}
