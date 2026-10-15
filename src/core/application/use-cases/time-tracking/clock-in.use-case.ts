import type { TimeRecord, Workday } from "../../../domain/entities";
import type { WorkdayRepository } from "../../../domain/ports/repositories/workday.repository";
import type { TimeRecordRepository } from "../../../domain/ports/repositories/time-record.repository";
import type { WorkerRepository } from "../../../domain/ports/repositories/worker.repository";
import type { CenterRepository } from "../../../domain/ports/repositories/center.repository";
import {
  NotFoundError,
  ClockError,
} from "../../../domain/errors/domain-errors";

interface ClockInResult {
  workday: Workday;
  timeRecord: TimeRecord;
}

export class ClockInUseCase {
  constructor(
    private workdayRepo: WorkdayRepository,
    private timeRecordRepo: TimeRecordRepository,
    private workerRepo: WorkerRepository,
    private centerRepo: CenterRepository
  ) {}

  async execute(workerId: string, now = new Date()): Promise<ClockInResult> {
    const today = now.toISOString().split("T")[0];

    // Check for unclosed records from previous days
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const recentWorkdays = await this.workdayRepo.findByWorkerInDateRange(
      workerId,
      sevenDaysAgo.toISOString().split("T")[0],
      yesterday.toISOString().split("T")[0]
    );

    if (recentWorkdays.length > 0) {
      const openPreviousRecord = await this.timeRecordRepo.findOpenByWorkdayIds(
        recentWorkdays.map((w) => w.id)
      );
      if (openPreviousRecord) {
        throw new ClockError(
          "Tienes un fichaje de entrada sin cerrar de un día anterior"
        );
      }
    }

    let workday = await this.workdayRepo.findByWorkerAndDate(workerId, today);

    if (!workday) {
      const worker = await this.workerRepo.findById(workerId);
      if (!worker) {
        throw new NotFoundError("Worker");
      }

      const center = await this.centerRepo.findById(worker.centerId);
      if (!center) {
        throw new NotFoundError("Centro");
      }

      workday = await this.workdayRepo.create({
        workerId,
        centerId: worker.centerId,
        day: today,
        typeDay: "normal",
        startWorkday: center.defaultStartWorkday,
        endWorkday: center.defaultEndWorkday,
        breakType: center.breakType,
        scheduledStartBreak: center.defaultStartBreak,
        scheduledEndBreak: center.defaultEndBreak,
      });
    }

    // Check time window: block clock-in more than 30 min before workday start
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = workday.startWorkday.split(":").map(Number);
    const earliestMinutes = startH * 60 + startM - 30;
    if (nowMinutes < earliestMinutes) {
      throw new ClockError(
        "No puedes fichar antes de 30 minutos del inicio de tu jornada"
      );
    }

    // Check if there's already an active record for today
    const activeRecord = await this.timeRecordRepo.findActiveByWorkdayId(
      workday.id
    );
    if (activeRecord) {
      throw new ClockError("Ya existe un registro activo");
    }

    const timeRecord = await this.timeRecordRepo.create({
      workdayId: workday.id,
      startHour: now.toISOString(),
    });

    return { workday, timeRecord };
  }
}
