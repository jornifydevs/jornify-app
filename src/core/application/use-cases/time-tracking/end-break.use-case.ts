import type { TimeRecord } from "../../../domain/entities";
import type { TimeRecordRepository } from "../../../domain/ports/repositories/time-record.repository";
import { ClockError } from "../../../domain/errors/domain-errors";

export class EndBreakUseCase {
  constructor(private timeRecordRepo: TimeRecordRepository) {}

  async execute(recordId: string, breakStartHour: string): Promise<TimeRecord> {
    const endTime = new Date();
    const startTime = new Date(breakStartHour);
    const diffMs = endTime.getTime() - startTime.getTime();

    if (diffMs < 0) {
      throw new ClockError(
        "La hora de inicio del descanso es posterior a la hora actual"
      );
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const breakTotalHour = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    return this.timeRecordRepo.update(recordId, {
      breakEndHour: endTime.toISOString(),
      breakTotalHour,
    });
  }
}
