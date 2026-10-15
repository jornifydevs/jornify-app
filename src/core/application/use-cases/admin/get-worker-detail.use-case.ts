import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import type { UserRepository } from "@/core/domain/ports/repositories/user.repository";
import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";
import type { TimeRecordRepository } from "@/core/domain/ports/repositories/time-record.repository";
import type { WorkerDetailDTO } from "../../dtos/admin-workers.dto";
import {
  NotFoundError,
  UnauthorizedError,
} from "@/core/domain/errors/domain-errors";

export class GetWorkerDetailUseCase {
  constructor(
    private workerRepo: WorkerRepository,
    private userRepo: UserRepository,
    private centerRepo: CenterRepository,
    private workdayRepo: WorkdayRepository,
    private timeRecordRepo: TimeRecordRepository
  ) {}

  async execute(workerId: string, companyId: string): Promise<WorkerDetailDTO> {
    const worker = await this.workerRepo.findById(workerId);
    if (!worker) throw new NotFoundError("Trabajador");

    const center = await this.centerRepo.findById(worker.centerId);
    if (!center || center.companyId !== companyId) {
      throw new UnauthorizedError("No tienes acceso a este trabajador");
    }

    const user = await this.userRepo.findById(worker.userId);
    if (!user) throw new NotFoundError("Usuario");

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const startDate = thirtyDaysAgo.toISOString().split("T")[0];
    const endDate = today.toISOString().split("T")[0];

    const workdays = await this.workdayRepo.findByWorkerInDateRange(
      workerId,
      startDate,
      endDate
    );

    const workdayIds = workdays.map((w) => w.id);
    const timeRecords =
      workdayIds.length > 0
        ? await this.timeRecordRepo.findCompletedByWorkdayIds(workdayIds)
        : [];

    const recordMap = new Map(timeRecords.map((r) => [r.workdayId, r]));

    const recentRecords = workdays.map((wd) => {
      const record = recordMap.get(wd.id);
      return {
        day: wd.day,
        typeDay: wd.typeDay,
        startHour: record?.startHour,
        endHour: record?.endHour,
        totalHour: record?.totalHour,
        breakStartHour: record?.breakStartHour,
        breakEndHour: record?.breakEndHour,
        breakTotalHour: record?.breakTotalHour,
      };
    });

    return {
      worker,
      userName: user.name,
      userLastName: user.lastName,
      userEmail: user.email,
      userPhone: user.phone,
      centerName: center?.name ?? "",
      recentRecords,
    };
  }
}
