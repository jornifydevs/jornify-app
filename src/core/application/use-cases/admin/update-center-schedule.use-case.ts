import type { Center } from "../../../domain/entities";
import type {
  CenterRepository,
  UpdateCenterData,
} from "../../../domain/ports/repositories/center.repository";
import {
  NotFoundError,
  ValidationError,
} from "../../../domain/errors/domain-errors";

export interface UpdateCenterScheduleInput {
  defaultStartWorkday: string;
  defaultEndWorkday: string;
  breakType: string;
  defaultStartBreak?: string;
  defaultEndBreak?: string;
}

export class UpdateCenterScheduleUseCase {
  constructor(private centerRepo: CenterRepository) {}

  async execute(
    centerId: string,
    input: UpdateCenterScheduleInput
  ): Promise<Center> {
    const existing = await this.centerRepo.findById(centerId);
    if (!existing) throw new NotFoundError("Centro");

    if (!input.defaultStartWorkday || !input.defaultEndWorkday) {
      throw new ValidationError(
        "El horario de entrada y salida es obligatorio"
      );
    }

    if (input.defaultStartWorkday >= input.defaultEndWorkday) {
      throw new ValidationError(
        "La hora de entrada debe ser anterior a la hora de salida"
      );
    }

    if (
      input.breakType === "scheduled" &&
      (!input.defaultStartBreak || !input.defaultEndBreak)
    ) {
      throw new ValidationError(
        "El descanso programado requiere hora de inicio y fin"
      );
    }

    if (
      input.breakType === "scheduled" &&
      input.defaultStartBreak &&
      input.defaultEndBreak
    ) {
      if (input.defaultStartBreak >= input.defaultEndBreak) {
        throw new ValidationError(
          "La hora de inicio del descanso debe ser anterior a la hora de fin"
        );
      }
      if (
        input.defaultStartBreak < input.defaultStartWorkday ||
        input.defaultEndBreak > input.defaultEndWorkday
      ) {
        throw new ValidationError(
          "El horario de descanso debe estar dentro del horario de trabajo"
        );
      }
    }

    const data: UpdateCenterData = {
      defaultStartWorkday: input.defaultStartWorkday,
      defaultEndWorkday: input.defaultEndWorkday,
      breakType: input.breakType,
      defaultStartBreak:
        input.breakType === "scheduled" ? input.defaultStartBreak : undefined,
      defaultEndBreak:
        input.breakType === "scheduled" ? input.defaultEndBreak : undefined,
    };

    return this.centerRepo.update(centerId, data);
  }
}
