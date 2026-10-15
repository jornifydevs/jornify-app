import type { WorkdayRepository } from "../../../domain/ports/repositories/workday.repository";
import type { Workday } from "../../../domain/entities";
import type { UpdateShiftInput } from "../../dtos/shifts.dto";
import {
  NotFoundError,
  ValidationError,
} from "../../../domain/errors/domain-errors";

export class UpdateWorkerShiftUseCase {
  constructor(private workdayRepo: WorkdayRepository) {}

  async execute(workdayId: string, input: UpdateShiftInput): Promise<Workday> {
    if (!input.startWorkday || !input.endWorkday) {
      throw new ValidationError(
        "El horario de entrada y salida es obligatorio"
      );
    }

    if (input.startWorkday >= input.endWorkday) {
      throw new ValidationError(
        "La hora de entrada debe ser anterior a la hora de salida"
      );
    }

    if (
      input.breakType === "scheduled" &&
      (!input.scheduledStartBreak || !input.scheduledEndBreak)
    ) {
      throw new ValidationError(
        "El descanso programado requiere hora de inicio y fin"
      );
    }

    const workday = await this.workdayRepo.findById(workdayId);
    if (!workday) {
      throw new NotFoundError("Turno");
    }

    return this.workdayRepo.update(workdayId, {
      startWorkday: input.startWorkday,
      endWorkday: input.endWorkday,
      shift: input.shift,
      breakType: input.breakType,
      scheduledStartBreak: input.scheduledStartBreak,
      scheduledEndBreak: input.scheduledEndBreak,
    });
  }
}
