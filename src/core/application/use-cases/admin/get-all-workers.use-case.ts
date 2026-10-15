import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import type { UserRepository } from "@/core/domain/ports/repositories/user.repository";
import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import type { WorkerWithUser } from "../../dtos/admin-workers.dto";

export class GetAllWorkersUseCase {
  constructor(
    private workerRepo: WorkerRepository,
    private userRepo: UserRepository,
    private centerRepo: CenterRepository
  ) {}

  async execute(companyId: string): Promise<WorkerWithUser[]> {
    const centers = await this.centerRepo.findByCompanyId(companyId);
    if (centers.length === 0) return [];

    const centerIds = centers.map((c) => c.id);
    const centerMap = new Map(centers.map((c) => [c.id, c]));

    const workers = await this.workerRepo.findByCenterIds(centerIds);
    if (workers.length === 0) return [];

    const userIds = [...new Set(workers.map((w) => w.userId))];
    const users = await this.userRepo.findByIds(userIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    return workers.map((worker) => {
      const user = userMap.get(worker.userId);
      const center = centerMap.get(worker.centerId);

      return {
        worker,
        userName: user?.name ?? "",
        userLastName: user?.lastName ?? "",
        userEmail: user?.email ?? "",
        centerName: center?.name ?? "",
      };
    });
  }
}
