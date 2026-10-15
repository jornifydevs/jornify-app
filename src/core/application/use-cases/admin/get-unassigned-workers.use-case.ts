import type { UserRepository } from "@/core/domain/ports/repositories/user.repository";
import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import type { User } from "@/core/domain/entities";

export class GetUnassignedWorkersUseCase {
  constructor(
    private userRepo: UserRepository,
    private workerRepo: WorkerRepository,
    private centerRepo: CenterRepository
  ) {}

  async execute(companyId: string): Promise<User[]> {
    // Get all centers for this company to scope worker look-up
    const centers = await this.centerRepo.findByCompanyId(companyId);
    const centerIds = centers.map((c) => c.id);

    // Get all users with role=worker belonging to this company, and all
    // worker records already assigned via those centers — in parallel.
    const [workerUsers, assignedWorkers] = await Promise.all([
      this.userRepo.findWorkersByCompanyId(companyId),
      this.workerRepo.findByCenterIds(centerIds),
    ]);

    const assignedUserIds = new Set(assignedWorkers.map((w) => w.userId));
    return workerUsers.filter((u) => !assignedUserIds.has(u.id));
  }
}
