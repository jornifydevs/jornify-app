import type { WorkerScheduleTemplateRepository } from "../../../domain/ports/repositories/worker-schedule-template.repository";
import type { WorkerScheduleTemplate } from "../../../domain/entities";

export class GetWorkerScheduleTemplateUseCase {
  constructor(private templateRepo: WorkerScheduleTemplateRepository) {}

  async execute(workerId: string): Promise<WorkerScheduleTemplate | null> {
    return this.templateRepo.findByWorkerId(workerId);
  }
}
