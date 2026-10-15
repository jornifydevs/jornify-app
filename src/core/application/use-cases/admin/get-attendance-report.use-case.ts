import type { WorkdayRepository } from "@/core/domain/ports/repositories/workday.repository";
import type { TimeRecordRepository } from "@/core/domain/ports/repositories/time-record.repository";
import type { WorkerRepository } from "@/core/domain/ports/repositories/worker.repository";
import type { UserRepository } from "@/core/domain/ports/repositories/user.repository";
import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import type {
  AttendanceRecord,
  AttendanceReportInput,
} from "../../dtos/admin-reports.dto";

export class GetAttendanceReportUseCase {
  constructor(
    private workdayRepo: WorkdayRepository,
    private timeRecordRepo: TimeRecordRepository,
    private workerRepo: WorkerRepository,
    private userRepo: UserRepository,
    private centerRepo: CenterRepository
  ) {}

  async execute(input: AttendanceReportInput): Promise<AttendanceRecord[]> {
    const { companyId, startDate, endDate, centerId } = input;

    const companyCenters = await this.centerRepo.findByCompanyId(companyId);
    const companyCenterIds = new Set(companyCenters.map((c) => c.id));

    if (centerId && !companyCenterIds.has(centerId)) {
      return [];
    }

    const workdays = centerId
      ? await this.workdayRepo.findByCenterAndDateRange(
          centerId,
          startDate,
          endDate
        )
      : (
          await Promise.all(
            companyCenters.map((c) =>
              this.workdayRepo.findByCenterAndDateRange(
                c.id,
                startDate,
                endDate
              )
            )
          )
        ).flat();

    if (workdays.length === 0) return [];

    const workdayIds = workdays.map((w) => w.id);
    const timeRecords =
      await this.timeRecordRepo.findCompletedByWorkdayIds(workdayIds);
    const recordMap = new Map(timeRecords.map((r) => [r.workdayId, r]));

    const workerIds = [...new Set(workdays.map((w) => w.workerId))];
    const workers = await Promise.all(
      workerIds.map((id) => this.workerRepo.findById(id))
    );
    const workerMap = new Map(workers.filter(Boolean).map((w) => [w!.id, w!]));

    const userIds = [...new Set(workers.filter(Boolean).map((w) => w!.userId))];
    const users = await this.userRepo.findByIds(userIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    const centerIds = [...new Set(workdays.map((w) => w.centerId))];
    const centers = await Promise.all(
      centerIds.map((id) => this.centerRepo.findById(id))
    );
    const centerMap = new Map(centers.filter(Boolean).map((c) => [c!.id, c!]));

    return workdays.map((wd) => {
      const worker = workerMap.get(wd.workerId);
      const user = worker ? userMap.get(worker.userId) : undefined;
      const center = centerMap.get(wd.centerId);
      const record = recordMap.get(wd.id);

      return {
        workerId: wd.workerId,
        workerName: user?.name ?? "",
        workerLastName: user?.lastName ?? "",
        centerName: center?.name ?? "",
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
  }
}
