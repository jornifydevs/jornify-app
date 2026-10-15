import type {
  WorkerScheduleTemplateRepository,
  UpsertWorkerScheduleTemplateData,
} from "../../../domain/ports/repositories/worker-schedule-template.repository";
import type { WorkerScheduleTemplate } from "../../../domain/entities";
import { ValidationError } from "../../../domain/errors/domain-errors";

export class SetWorkerScheduleTemplateUseCase {
  constructor(private templateRepo: WorkerScheduleTemplateRepository) {}

  async execute(
    data: UpsertWorkerScheduleTemplateData
  ): Promise<WorkerScheduleTemplate> {
    if (data.days.length !== 7) {
      throw new ValidationError("La plantilla debe tener exactamente 7 días");
    }

    const dayOfWeeks = data.days.map((d) => d.dayOfWeek).sort((a, b) => a - b);
    const expected = [0, 1, 2, 3, 4, 5, 6];
    const isComplete = expected.every((d, i) => dayOfWeeks[i] === d);
    if (!isComplete) {
      throw new ValidationError(
        "La plantilla debe incluir los 7 días de la semana (0-6)"
      );
    }

    for (const day of data.days) {
      if (day.isWorkingDay) {
        if (!day.startWorkday || !day.endWorkday) {
          throw new ValidationError(
            `El día ${day.dayOfWeek} debe tener hora de inicio y fin`
          );
        }
      }
    }

    return this.templateRepo.upsert(data);
  }
}
