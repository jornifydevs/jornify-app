import type { WorkdayRepository } from "../../../domain/ports/repositories/workday.repository";
import type { WorkerRepository } from "../../../domain/ports/repositories/worker.repository";
import type { Workday } from "../../../domain/entities";
import {
  NotFoundError,
  ValidationError,
} from "../../../domain/errors/domain-errors";

export class GetWorkerScheduleUseCase {
  constructor(
    private workdayRepo: WorkdayRepository,
    private workerRepo: WorkerRepository
  ) {}

  async execute(
    workerId: string,
    startDate: string,
    endDate: string
  ): Promise<Workday[]> {
    if (!startDate || !endDate) {
      throw new ValidationError("Las fechas son obligatorias");
    }

    if (startDate > endDate) {
      throw new ValidationError(
        "La fecha de inicio debe ser anterior o igual a la fecha de fin"
      );
    }

    const worker = await this.workerRepo.findById(workerId);
    if (!worker) {
      throw new NotFoundError("Trabajador");
    }

    return this.workdayRepo.findByWorkerInDateRange(
      workerId,
      startDate,
      endDate
    );
  }
}
