import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  WorkerScheduleTemplateRepository,
  UpsertWorkerScheduleTemplateData,
} from "@/core/domain/ports/repositories/worker-schedule-template.repository";
import type {
  WorkerScheduleTemplate,
  WorkerScheduleTemplateDay,
} from "@/core/domain/entities";

interface WorkerScheduleTemplateRow {
  id: string;
  worker_id: string;
  center_id: string;
  days: unknown;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseWorkerScheduleTemplateRepository
  implements WorkerScheduleTemplateRepository
{
  constructor(private supabase: SupabaseClient) {}

  async findByWorkerId(
    workerId: string
  ): Promise<WorkerScheduleTemplate | null> {
    const { data } = await this.supabase
      .from("worker_schedule_template")
      .select("*")
      .eq("worker_id", workerId)
      .single();

    return data ? this.toDomain(data) : null;
  }

  async findByWorkerIds(
    workerIds: string[]
  ): Promise<WorkerScheduleTemplate[]> {
    if (workerIds.length === 0) return [];

    const { data } = await this.supabase
      .from("worker_schedule_template")
      .select("*")
      .in("worker_id", workerIds);

    return (data ?? []).map((row: WorkerScheduleTemplateRow) =>
      this.toDomain(row)
    );
  }

  async upsert(
    data: UpsertWorkerScheduleTemplateData
  ): Promise<WorkerScheduleTemplate> {
    const { data: row, error } = await this.supabase
      .from("worker_schedule_template")
      .upsert(
        {
          worker_id: data.workerId,
          center_id: data.centerId,
          days: data.days,
        },
        { onConflict: "worker_id" }
      )
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(row);
  }

  private toDomain(row: WorkerScheduleTemplateRow): WorkerScheduleTemplate {
    return {
      id: row.id,
      workerId: row.worker_id,
      centerId: row.center_id,
      days: row.days as WorkerScheduleTemplateDay[],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
