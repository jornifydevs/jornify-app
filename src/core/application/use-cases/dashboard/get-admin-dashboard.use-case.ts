import type { WorkerRepository } from "../../../domain/ports/repositories/worker.repository";
import type { CenterRepository } from "../../../domain/ports/repositories/center.repository";
import type { WorkdayRepository } from "../../../domain/ports/repositories/workday.repository";
import type { AdminDashboardDTO } from "../../dtos/dashboard.dto";

export class GetAdminDashboardUseCase {
  constructor(
    private workerRepo: WorkerRepository,
    private centerRepo: CenterRepository,
    private workdayRepo: WorkdayRepository
  ) {}

  async execute(): Promise<AdminDashboardDTO> {
    const today = new Date().toISOString().split("T")[0];

    const [totalWorkers, totalCenters, activeToday] = await Promise.all([
      this.workerRepo.countAll(),
      this.centerRepo.countAll(),
      this.workdayRepo.countActiveByDate(today),
    ]);

    return { totalWorkers, totalCenters, activeToday };
  }
}
