import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import type { CenterWithWorkerCount } from "../../dtos/admin-centers.dto";

export class GetAllCentersUseCase {
  constructor(
    private centerRepo: CenterRepository,
    private workerRepo: WorkerRepository
  ) {}

  async execute(companyId: string): Promise<CenterWithWorkerCount[]> {
    const centers = await this.centerRepo.findByCompanyId(companyId);

    const results = await Promise.all(
      centers.map(async (center) => {
        const workers = await this.workerRepo.findByCenterId(center.id);
        return {
          ...center,
          workerCount: workers.length,
        };
      })
    );

    return results;
  }
}
