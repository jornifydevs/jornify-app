import type { WorkdayRepository } from "../../../domain/ports/repositories/workday.repository";
import type { TimeRecordRepository } from "../../../domain/ports/repositories/time-record.repository";
import type { TimeRecordWithWorkday } from "../../dtos/work-history.dto";

export class ExportWorkHistoryUseCase {
  constructor(
    private workdayRepo: WorkdayRepository,
    private timeRecordRepo: TimeRecordRepository
  ) {}

  async execute(
    workerId: string,
    startDate: string,
    endDate: string
  ): Promise<TimeRecordWithWorkday[]> {
    const workdays = await this.workdayRepo.findByWorkerInDateRange(
      workerId,
      startDate,
      endDate
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
}
