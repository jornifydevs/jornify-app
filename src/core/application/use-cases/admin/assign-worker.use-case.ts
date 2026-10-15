import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import type { Worker } from "@/core/domain/entities";
import { ValidationError } from "@/core/domain/errors/domain-errors";

interface AssignWorkerInput {
  userId: string;
  centerId: string;
  dni: string;
  contractType: string;
  hourWeek: number;
  job: string;
}

export class AssignWorkerUseCase {
  constructor(private workerRepo: WorkerRepository) {}

  async execute(input: AssignWorkerInput): Promise<Worker> {
    const { userId, centerId, dni, contractType, hourWeek, job } = input;

    if (!userId || !centerId || !dni || !contractType || !job) {
      throw new ValidationError("Todos los campos son obligatorios");
    }
    if (hourWeek <= 0 || hourWeek > 168) {
      throw new ValidationError(
        "Las horas semanales deben estar entre 1 y 168"
      );
    }

    return this.workerRepo.create({
      userId,
      centerId,
      dni,
      contractType,
      hourWeek,
      job,
    });
  }
}
