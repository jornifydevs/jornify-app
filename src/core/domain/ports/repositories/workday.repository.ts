import type { Workday } from "../../entities";

export type CreateWorkdayData = Omit<Workday, "id" | "createdAt" | "updatedAt">;

export type UpdateWorkdayData = Partial<
  Pick<
    Workday,
    | "startWorkday"
    | "endWorkday"
    | "typeDay"
    | "shift"
    | "breakType"
    | "scheduledStartBreak"
    | "scheduledEndBreak"
    | "workerId"
  >
>;

export interface WorkdayRepository {
  findByWorkerAndDate(workerId: string, date: string): Promise<Workday | null>;
  findByWorkerInDateRange(
    workerId: string,
    startDate: string,
    endDate?: string
  ): Promise<Workday[]>;
  findByWorkerAndTypeDays(
    workerId: string,
    typeDays: string[],
    startDate?: string,
    endDate?: string
  ): Promise<Workday[]>;
  create(data: CreateWorkdayData): Promise<Workday>;
  createMany(data: CreateWorkdayData[]): Promise<Workday[]>;
  countActiveByDate(date: string): Promise<number>;
  findByDateRange(startDate: string, endDate: string): Promise<Workday[]>;
  findByCenterAndDateRange(
    centerId: string,
    startDate: string,
    endDate: string
  ): Promise<Workday[]>;
  findIdsByWorkerId(workerId: string): Promise<string[]>;
  deleteAllByWorkerId(workerId: string): Promise<void>;
  findById(id: string): Promise<Workday | null>;
  update(id: string, data: UpdateWorkdayData): Promise<Workday>;
  updateWorkerId(workdayId: string, newWorkerId: string): Promise<Workday>;
}
