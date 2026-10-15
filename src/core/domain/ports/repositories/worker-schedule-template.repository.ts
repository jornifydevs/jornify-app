import type {
  WorkerScheduleTemplate,
  WorkerScheduleTemplateDay,
} from "../../entities";

export interface UpsertWorkerScheduleTemplateData {
  workerId: string;
  centerId: string;
  days: WorkerScheduleTemplateDay[];
}

export interface WorkerScheduleTemplateRepository {
  findByWorkerId(workerId: string): Promise<WorkerScheduleTemplate | null>;
  findByWorkerIds(workerIds: string[]): Promise<WorkerScheduleTemplate[]>;
  upsert(
    data: UpsertWorkerScheduleTemplateData
  ): Promise<WorkerScheduleTemplate>;
}
