import type { WorkdayRepository } from "../../../domain/ports/repositories/workday.repository";
import type { Workday } from "../../../domain/entities";
import { ValidationError } from "../../../domain/errors/domain-errors";

export interface CreateSingleWorkdayInput {
  workerId: string;
  centerId: string;
  date: string; // "YYYY-MM-DD"
  startWorkday: string; // "09:00:00"
  endWorkday: string; // "18:00:00"
  breakType?: string;
  scheduledStartBreak?: string;
  scheduledEndBreak?: string;
}

export class CreateSingleWorkdayUseCase {
  constructor(private workdayRepo: WorkdayRepository) {}

  async execute(input: CreateSingleWorkdayInput): Promise<Workday> {
    const existing = await this.workdayRepo.findByWorkerAndDate(
      input.workerId,
      input.date
    );

    if (existing) {
      throw new ValidationError(
        `Ya existe un workday para el trabajador en la fecha ${input.date}`
      );
    }

    return this.workdayRepo.create({
      workerId: input.workerId,
      centerId: input.centerId,
      day: input.date,
      typeDay: "normal",
      startWorkday: input.startWorkday,
      endWorkday: input.endWorkday,
      breakType: input.breakType,
      scheduledStartBreak: input.scheduledStartBreak,
      scheduledEndBreak: input.scheduledEndBreak,
    });
  }
}
