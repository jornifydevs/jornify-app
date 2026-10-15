import type { WorkdayRepository } from "../../../domain/ports/repositories/workday.repository";
import type { WorkerRepository } from "../../../domain/ports/repositories/worker.repository";
import type { Workday } from "../../../domain/entities";
import type { RequestDayOffInput } from "../../dtos/availability.dto";
import {
  ValidationError,
  NotFoundError,
} from "../../../domain/errors/domain-errors";

export class RequestDayOffUseCase {
  constructor(
    private workdayRepo: WorkdayRepository,
    private workerRepo: WorkerRepository
  ) {}

  async execute(input: RequestDayOffInput): Promise<Workday[]> {
    if (!input.typeDay || input.typeDay === "normal") {
      throw new ValidationError(
        "El tipo de día no puede ser vacío ni 'normal'"
      );
    }

    if (input.startDay > input.endDay) {
      throw new ValidationError(
        "La fecha de inicio debe ser anterior o igual a la fecha de fin"
      );
    }

    const today = new Date().toISOString().split("T")[0];
    if (input.startDay < today) {
      throw new ValidationError(
        "No se puede solicitar un día libre en una fecha pasada"
      );
    }

    const worker = await this.workerRepo.findById(input.workerId);
    if (!worker) {
      throw new NotFoundError("Trabajador");
    }

    const dates = this.generateDateRange(input.startDay, input.endDay);

    const existingWorkdays = await this.workdayRepo.findByWorkerInDateRange(
      input.workerId,
      input.startDay,
      input.endDay
    );
    const existingByDate = new Map(existingWorkdays.map((w) => [w.day, w]));

    // Solo bloquear si ya existe un registro no-normal (vacaciones, baja, etc.)
    const conflicting = dates.filter((d) => {
      const existing = existingByDate.get(d);
      return existing && existing.typeDay !== "normal";
    });

    if (conflicting.length > 0) {
      throw new ValidationError(
        `Ya existen registros para las fechas: ${conflicting.join(", ")}`
      );
    }

    const results: Workday[] = [];

    // Actualizar días normales existentes en lugar de crear duplicados
    const datesToUpdate = dates.filter((d) => existingByDate.has(d));
    for (const day of datesToUpdate) {
      const existing = existingByDate.get(day)!;
      const updated = await this.workdayRepo.update(existing.id, {
        typeDay: input.typeDay,
        startWorkday: "00:00:00",
        endWorkday: "00:00:00",
      });
      results.push(updated);
    }

    // Crear nuevos registros para fechas sin workday
    const datesToCreate = dates.filter((d) => !existingByDate.has(d));
    if (datesToCreate.length > 0) {
      const records = datesToCreate.map((day) => ({
        workerId: input.workerId,
        centerId: input.centerId,
        day,
        typeDay: input.typeDay,
        startWorkday: "00:00:00",
        endWorkday: "00:00:00",
      }));
      const created = await this.workdayRepo.createMany(records);
      results.push(...created);
    }

    return results;
  }

  private generateDateRange(start: string, end: string): string[] {
    const dates: string[] = [];
    const current = new Date(start + "T00:00:00");
    const last = new Date(end + "T00:00:00");
    while (current <= last) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, "0");
      const d = String(current.getDate()).padStart(2, "0");
      dates.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }
}
