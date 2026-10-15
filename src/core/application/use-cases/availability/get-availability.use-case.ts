import type { WorkdayRepository } from "../../../domain/ports/repositories/workday.repository";
import type { Workday } from "../../../domain/entities";

export class GetAvailabilityUseCase {
  constructor(private workdayRepo: WorkdayRepository) {}

  async execute(
    workerId: string,
    typeDay?: string,
    year?: number
  ): Promise<Workday[]> {
    const typeDays = typeDay ? [typeDay] : [];

    let startDate: string | undefined;
    let endDate: string | undefined;

    if (year) {
      startDate = `${year}-01-01`;
      endDate = `${year}-12-31`;
    }

    return this.workdayRepo.findByWorkerAndTypeDays(
      workerId,
      typeDays,
      startDate,
      endDate
    );
  }
}
