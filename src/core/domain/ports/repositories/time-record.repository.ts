import type { TimeRecord } from "../../entities";

export interface TimeRecordRepository {
  findActiveByWorkdayId(workdayId: string): Promise<TimeRecord | null>;
  findOpenByWorkdayIds(workdayIds: string[]): Promise<TimeRecord | null>;
  findCompletedByWorkdayIds(workdayIds: string[]): Promise<TimeRecord[]>;
  create(data: { workdayId: string; startHour: string }): Promise<TimeRecord>;
  update(id: string, data: Partial<TimeRecord>): Promise<TimeRecord>;
  deleteAllByWorkdayIds(workdayIds: string[]): Promise<void>;
}
