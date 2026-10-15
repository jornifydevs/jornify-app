import type { WorkdayRepository } from "../../../domain/ports/repositories/workday.repository";
import type { TimeRecordRepository } from "../../../domain/ports/repositories/time-record.repository";
import type {
  HistoryFilter,
  TimeRecordWithWorkday,
} from "../../dtos/work-history.dto";

export class GetWorkHistoryUseCase {
  constructor(
    private workdayRepo: WorkdayRepository,
    private timeRecordRepo: TimeRecordRepository
  ) {}

  async execute(
    workerId: string,
    filter: HistoryFilter,
    offset: number = 0
  ): Promise<TimeRecordWithWorkday[]> {
    const { startDate, endDate } = this.calculateDateRange(filter, offset);
    const startDateStr = this.formatDateLocal(startDate);
    const endDateStr = this.formatDateLocal(endDate);

    const workdays = await this.workdayRepo.findByWorkerInDateRange(
      workerId,
      startDateStr,
      endDateStr
    );

    if (workdays.length === 0) {
      return [];
    }

    const workdayIds = workdays.map((w) => w.id);
    const timeRecords =
      await this.timeRecordRepo.findCompletedByWorkdayIds(workdayIds);

    return timeRecords.map((record) => ({
      ...record,
      workday: workdays.find((w) => w.id === record.workdayId)!,
    }));
  }

  private calculateDateRange(
    filter: HistoryFilter,
    offset: number
  ): { startDate: Date; endDate: Date } {
    const now = new Date();

    switch (filter) {
      case "today": {
        const day = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - offset
        );
        return { startDate: day, endDate: day };
      }
      case "week": {
        // Calcular el lunes de la semana actual
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const currentMonday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - daysToMonday
        );
        // Restar semanas según el offset
        const targetMonday = new Date(currentMonday);
        targetMonday.setDate(targetMonday.getDate() - offset * 7);
        const targetSunday = new Date(targetMonday);
        targetSunday.setDate(targetSunday.getDate() + 6);
        return { startDate: targetMonday, endDate: targetSunday };
      }
      case "month": {
        // Primer día del mes con offset
        const targetMonth = now.getMonth() - offset;
        const targetYear = now.getFullYear();
        const startDate = new Date(targetYear, targetMonth, 1);
        // Último día del mes
        const endDate = new Date(targetYear, targetMonth + 1, 0);
        return { startDate, endDate };
      }
    }
  }

  private formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
