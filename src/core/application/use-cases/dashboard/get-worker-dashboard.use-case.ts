import type { UserRepository } from "../../../domain/ports/repositories/user.repository";
import type { WorkerRepository } from "../../../domain/ports/repositories/worker.repository";
import type { WorkerDashboardDTO } from "../../dtos/dashboard.dto";
import { NotFoundError } from "../../../domain/errors/domain-errors";

export class GetWorkerDashboardUseCase {
  constructor(
    private userRepo: UserRepository,
    private workerRepo: WorkerRepository
  ) {}

  async execute(email: string): Promise<WorkerDashboardDTO> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new NotFoundError("Usuario");
    }

    const worker = await this.workerRepo.findByUserId(user.id);
    if (!worker) {
      throw new NotFoundError("Trabajador");
    }

    return { user, worker };
  }
}
