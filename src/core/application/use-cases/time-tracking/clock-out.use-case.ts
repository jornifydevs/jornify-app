import type { TimeRecord } from "../../../domain/entities";
import type { TimeRecordRepository } from "../../../domain/ports/repositories/time-record.repository";
import { ClockError } from "../../../domain/errors/domain-errors";

export class ClockOutUseCase {
  constructor(private timeRecordRepo: TimeRecordRepository) {}

  async execute(
    recordId: string,
    startHour: string,
    breakStartHour?: string,
    breakTotalHour?: string
  ): Promise<TimeRecord> {
    const endTime = new Date();
    const startTime = new Date(startHour);

    const grossDiffMs = endTime.getTime() - startTime.getTime();
    if (grossDiffMs < 0) {
      throw new ClockError("La hora de inicio es posterior a la hora actual");
    }

    // Calculate break time to subtract
    let breakMs = 0;
    const updateData: Partial<TimeRecord> = {};

    if (breakStartHour && !breakTotalHour) {
      // Break is still active: auto-end it
      const breakStart = new Date(breakStartHour);
      breakMs = endTime.getTime() - breakStart.getTime();

      const breakSeconds = Math.floor(breakMs / 1000);
      const bh = Math.floor(breakSeconds / 3600);
      const bm = Math.floor((breakSeconds % 3600) / 60);
      const bs = breakSeconds % 60;
      updateData.breakEndHour = endTime.toISOString();
      updateData.breakTotalHour = `${bh.toString().padStart(2, "0")}:${bm.toString().padStart(2, "0")}:${bs.toString().padStart(2, "0")}`;
    } else if (breakTotalHour) {
      // Break already completed: parse stored duration
      const [h, m, s] = breakTotalHour.split(":").map(Number);
      breakMs = (h * 3600 + m * 60 + s) * 1000;
    }

    // Net working time = gross time - break time
    const netDiffMs = Math.max(grossDiffMs - breakMs, 0);
    const totalSeconds = Math.floor(netDiffMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const totalHour = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    updateData.endHour = endTime.toISOString();
    updateData.totalHour = totalHour;

    return this.timeRecordRepo.update(recordId, updateData);
  }
}
