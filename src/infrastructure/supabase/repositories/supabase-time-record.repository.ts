import type { SupabaseClient } from "@supabase/supabase-js";
import type { TimeRecord } from "@/core/domain/entities";
import type { TimeRecordRepository } from "@/core/domain/ports/repositories/time-record.repository";

interface TimeRecordRow {
  id: string;
  workday_id: string;
  start_hour?: string;
  end_hour?: string;
  total_hour?: string;
  break_start_hour?: string;
  break_end_hour?: string;
  break_total_hour?: string;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseTimeRecordRepository implements TimeRecordRepository {
  constructor(private supabase: SupabaseClient) {}

  async findActiveByWorkdayId(workdayId: string): Promise<TimeRecord | null> {
    const { data } = await this.supabase
      .from("time_record")
      .select("*")
      .eq("workday_id", workdayId)
      .is("end_hour", null)
      .single();

    return data ? this.toDomain(data) : null;
  }

  async findOpenByWorkdayIds(workdayIds: string[]): Promise<TimeRecord | null> {
    if (workdayIds.length === 0) return null;
    const { data } = await this.supabase
      .from("time_record")
      .select("*")
      .in("workday_id", workdayIds)
      .is("end_hour", null)
      .limit(1)
      .maybeSingle();

    return data ? this.toDomain(data) : null;
  }

  async findCompletedByWorkdayIds(workdayIds: string[]): Promise<TimeRecord[]> {
    const { data } = await this.supabase
      .from("time_record")
      .select("*")
      .in("workday_id", workdayIds)
      .not("end_hour", "is", null)
      .order("created_at", { ascending: false });

    return (data ?? []).map((row: TimeRecordRow) => this.toDomain(row));
  }

  async create(data: {
    workdayId: string;
    startHour: string;
  }): Promise<TimeRecord> {
    const { data: row, error } = await this.supabase
      .from("time_record")
      .insert({
        workday_id: data.workdayId,
        start_hour: data.startHour,
      })
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(row);
  }

  async update(id: string, data: Partial<TimeRecord>): Promise<TimeRecord> {
    const updateData: Record<string, unknown> = {};
    if (data.endHour !== undefined) updateData.end_hour = data.endHour;
    if (data.totalHour !== undefined) updateData.total_hour = data.totalHour;
    if (data.breakStartHour !== undefined)
      updateData.break_start_hour = data.breakStartHour;
    if (data.breakEndHour !== undefined)
      updateData.break_end_hour = data.breakEndHour;
    if (data.breakTotalHour !== undefined)
      updateData.break_total_hour = data.breakTotalHour;

    const { data: row, error } = await this.supabase
      .from("time_record")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(row);
  }

  async deleteAllByWorkdayIds(workdayIds: string[]): Promise<void> {
    if (workdayIds.length === 0) return;
    await this.supabase
      .from("time_record")
      .delete()
      .in("workday_id", workdayIds);
  }

  private toDomain(row: TimeRecordRow): TimeRecord {
    return {
      id: row.id,
      workdayId: row.workday_id,
      startHour: row.start_hour,
      endHour: row.end_hour,
      totalHour: row.total_hour,
      breakStartHour: row.break_start_hour,
      breakEndHour: row.break_end_hour,
      breakTotalHour: row.break_total_hour,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
