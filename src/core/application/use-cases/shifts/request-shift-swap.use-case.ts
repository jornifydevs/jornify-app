import type { WorkdayRepository } from "../../../domain/ports/repositories/workday.repository";
import type { ShiftSwapRequestRepository } from "../../../domain/ports/repositories/shift-swap-request.repository";
import type { ShiftSwapRequest } from "../../../domain/entities";
import type { RequestShiftSwapInput } from "../../dtos/shifts.dto";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../../domain/errors/domain-errors";

export class RequestShiftSwapUseCase {
  constructor(
    private workdayRepo: WorkdayRepository,
    private swapRepo: ShiftSwapRequestRepository
  ) {}

  async execute(input: RequestShiftSwapInput): Promise<ShiftSwapRequest> {
    if (input.requesterId === input.targetId) {
      throw new ValidationError(
        "No puedes solicitar un cambio de turno contigo mismo"
      );
    }

    const requesterWorkday = await this.workdayRepo.findById(
      input.requesterWorkdayId
    );
    if (!requesterWorkday) {
      throw new NotFoundError("Turno del solicitante");
    }

    const targetWorkday = await this.workdayRepo.findById(
      input.targetWorkdayId
    );
    if (!targetWorkday) {
      throw new NotFoundError("Turno del destinatario");
    }

    if (requesterWorkday.workerId !== input.requesterId) {
      throw new UnauthorizedError("El turno no pertenece al solicitante");
    }

    if (targetWorkday.workerId !== input.targetId) {
      throw new ValidationError("El turno no pertenece al trabajador indicado");
    }

    if (requesterWorkday.centerId !== targetWorkday.centerId) {
      throw new ValidationError(
        "Solo se pueden intercambiar turnos dentro del mismo centro"
      );
    }

    const today = new Date().toISOString().split("T")[0];

    if (requesterWorkday.day < today) {
      throw new ValidationError(
        "No se puede solicitar un cambio para una fecha pasada"
      );
    }

    if (targetWorkday.day < today) {
      throw new ValidationError(
        "El turno destino pertenece a una fecha pasada"
      );
    }

    const pendingRequester = await this.swapRepo.findPendingByWorkdayId(
      input.requesterWorkdayId
    );
    if (pendingRequester) {
      throw new ValidationError(
        "Ya existe una solicitud de cambio pendiente para este turno"
      );
    }

    const pendingTarget = await this.swapRepo.findPendingByWorkdayId(
      input.targetWorkdayId
    );
    if (pendingTarget) {
      throw new ValidationError(
        "El turno destino ya tiene una solicitud de cambio pendiente"
      );
    }

    return this.swapRepo.create({
      requesterId: input.requesterId,
      targetId: input.targetId,
      requesterWorkdayId: input.requesterWorkdayId,
      targetWorkdayId: input.targetWorkdayId,
      centerId: requesterWorkday.centerId,
      requesterNote: input.requesterNote,
    });
  }
}
