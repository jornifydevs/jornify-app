import type { TimeRecord } from "../../../domain/entities";
import type { TimeRecordRepository } from "../../../domain/ports/repositories/time-record.repository";
import type { WorkdayRepository } from "../../../domain/ports/repositories/workday.repository";
import type { CenterRepository } from "../../../domain/ports/repositories/center.repository";
import { ClockError } from "../../../domain/errors/domain-errors";

export class StartBreakUseCase {
  constructor(
    private timeRecordRepo: TimeRecordRepository,
    private workdayRepo: WorkdayRepository,
    private centerRepo: CenterRepository
  ) {}

  async execute(workerId: string): Promise<TimeRecord> {
    const today = new Date().toISOString().split("T")[0];

    const workday = await this.workdayRepo.findByWorkerAndDate(workerId, today);
    if (!workday) {
      throw new ClockError("No hay jornada activa hoy");
    }

    const center = await this.centerRepo.findById(workday.centerId);
    if (!center || !center.enabledFeatures.includes("break")) {
      throw new ClockError("La funcionalidad de descanso no está habilitada");
    }

    if (workday.breakType === "none") {
      throw new ClockError("Este centro no tiene descansos configurados");
    }

    const activeRecord = await this.timeRecordRepo.findActiveByWorkdayId(
      workday.id
    );
    if (!activeRecord) {
      throw new ClockError("No hay registro de fichaje activo");
    }

    if (activeRecord.breakStartHour) {
      throw new ClockError("Ya se ha registrado un descanso hoy");
    }

    if (
      workday.breakType === "scheduled" &&
      workday.scheduledStartBreak &&
      workday.scheduledEndBreak
    ) {
      const now = new Date();
      const [sh, sm] = workday.scheduledStartBreak.split(":").map(Number);
      const [eh, em] = workday.scheduledEndBreak.split(":").map(Number);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;

      if (currentMinutes < startMinutes || currentMinutes >= endMinutes) {
        throw new ClockError(
          `El descanso programado es de ${workday.scheduledStartBreak} a ${workday.scheduledEndBreak}`
        );
      }
    }

    return this.timeRecordRepo.update(activeRecord.id, {
      breakStartHour: new Date().toISOString(),
    });
  }
}
