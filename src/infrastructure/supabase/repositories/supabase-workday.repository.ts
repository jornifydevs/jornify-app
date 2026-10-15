import type { SupabaseClient } from "@supabase/supabase-js";
import type { Workday } from "@/core/domain/entities";
import type {
  WorkdayRepository,
  CreateWorkdayData,
  UpdateWorkdayData,
} from "@/core/domain/ports/repositories/workday.repository";

interface WorkdayRow {
  id: string;
  worker_id: string;
  center_id: string;
  day: string;
  type_day: string;
  start_workday: string;
  end_workday: string;
  shift?: string;
  break_type?: string;
  scheduled_start_break?: string;
  scheduled_end_break?: string;
  digital_signature?: boolean;
  signature?: string;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseWorkdayRepository implements WorkdayRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByWorkerAndDate(
    workerId: string,
    date: string
  ): Promise<Workday | null> {
    const { data } = await this.supabase
      .from("workday")
      .select("*")
      .eq("worker_id", workerId)
      .eq("day", date)
      .single();

    return data ? this.toDomain(data) : null;
  }

  async findByWorkerInDateRange(
    workerId: string,
    startDate: string,
    endDate?: string
  ): Promise<Workday[]> {
    let query = this.supabase
      .from("workday")
      .select("*")
      .eq("worker_id", workerId)
      .gte("day", startDate);

    if (endDate) {
      query = query.lte("day", endDate);
    }

    const { data } = await query.order("day", { ascending: false });

    return (data ?? []).map((row: WorkdayRow) => this.toDomain(row));
  }

  async findByWorkerAndTypeDays(
    workerId: string,
    typeDays: string[],
    startDate?: string,
    endDate?: string
  ): Promise<Workday[]> {
    let query = this.supabase
      .from("workday")
      .select("*")
      .eq("worker_id", workerId);

    if (typeDays.length > 0) {
      query = query.in("type_day", typeDays);
    } else {
      query = query.neq("type_day", "normal");
    }

    if (startDate) {
      query = query.gte("day", startDate);
    }
    if (endDate) {
      query = query.lte("day", endDate);
    }

    const { data } = await query.order("day", { ascending: false });

    return (data ?? []).map((row: WorkdayRow) => this.toDomain(row));
  }

  async create(data: CreateWorkdayData): Promise<Workday> {
    const insertData: Record<string, unknown> = {
      worker_id: data.workerId,
      center_id: data.centerId,
      day: data.day,
      type_day: data.typeDay,
      start_workday: data.startWorkday,
      end_workday: data.endWorkday,
    };
    if (data.breakType !== undefined) insertData.break_type = data.breakType;
    if (data.scheduledStartBreak !== undefined)
      insertData.scheduled_start_break = data.scheduledStartBreak;
    if (data.scheduledEndBreak !== undefined)
      insertData.scheduled_end_break = data.scheduledEndBreak;

    const { data: row, error } = await this.supabase
      .from("workday")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(row);
  }

  async createMany(data: CreateWorkdayData[]): Promise<Workday[]> {
    const rows = data.map((d) => {
      const row: Record<string, unknown> = {
        worker_id: d.workerId,
        center_id: d.centerId,
        day: d.day,
        type_day: d.typeDay,
        start_workday: d.startWorkday,
        end_workday: d.endWorkday,
      };
      if (d.breakType !== undefined) row.break_type = d.breakType;
      if (d.scheduledStartBreak !== undefined)
        row.scheduled_start_break = d.scheduledStartBreak;
      if (d.scheduledEndBreak !== undefined)
        row.scheduled_end_break = d.scheduledEndBreak;
      return row;
    });

    const { data: result, error } = await this.supabase
      .from("workday")
      .insert(rows)
      .select();

    if (error) throw error;
    return (result ?? []).map((row: WorkdayRow) => this.toDomain(row));
  }

  async countActiveByDate(date: string): Promise<number> {
    const { count } = await this.supabase
      .from("workday")
      .select("*", { count: "exact", head: true })
      .eq("day", date);

    return count ?? 0;
  }

  async findByDateRange(
    startDate: string,
    endDate: string
  ): Promise<Workday[]> {
    const { data } = await this.supabase
      .from("workday")
      .select("*")
      .gte("day", startDate)
      .lte("day", endDate)
      .order("day", { ascending: false });

    return (data ?? []).map((row: WorkdayRow) => this.toDomain(row));
  }

  async findByCenterAndDateRange(
    centerId: string,
    startDate: string,
    endDate: string
  ): Promise<Workday[]> {
    const { data } = await this.supabase
      .from("workday")
      .select("*")
      .eq("center_id", centerId)
      .gte("day", startDate)
      .lte("day", endDate)
      .order("day", { ascending: false });

    return (data ?? []).map((row: WorkdayRow) => this.toDomain(row));
  }

  async findIdsByWorkerId(workerId: string): Promise<string[]> {
    const { data } = await this.supabase
      .from("workday")
      .select("id")
      .eq("worker_id", workerId);

    return (data ?? []).map((row: { id: string }) => row.id);
  }

  async deleteAllByWorkerId(workerId: string): Promise<void> {
    await this.supabase.from("workday").delete().eq("worker_id", workerId);
  }

  async findById(id: string): Promise<Workday | null> {
    const { data } = await this.supabase
      .from("workday")
      .select("*")
      .eq("id", id)
      .single();

    return data ? this.toDomain(data) : null;
  }

  async update(id: string, data: UpdateWorkdayData): Promise<Workday> {
    const payload: Record<string, unknown> = {};
    if (data.workerId !== undefined) payload.worker_id = data.workerId;
    if (data.typeDay !== undefined) payload.type_day = data.typeDay;
    if (data.startWorkday !== undefined)
      payload.start_workday = data.startWorkday;
    if (data.endWorkday !== undefined) payload.end_workday = data.endWorkday;
    if (data.shift !== undefined) payload.shift = data.shift;
    if (data.breakType !== undefined) payload.break_type = data.breakType;
    if (data.scheduledStartBreak !== undefined)
      payload.scheduled_start_break = data.scheduledStartBreak;
    if (data.scheduledEndBreak !== undefined)
      payload.scheduled_end_break = data.scheduledEndBreak;

    const { data: row, error } = await this.supabase
      .from("workday")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(row);
  }

  async updateWorkerId(
    workdayId: string,
    newWorkerId: string
  ): Promise<Workday> {
    const { data: row, error } = await this.supabase
      .from("workday")
      .update({ worker_id: newWorkerId })
      .eq("id", workdayId)
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(row);
  }

  private toDomain(row: WorkdayRow): Workday {
    return {
      id: row.id,
      workerId: row.worker_id,
      centerId: row.center_id,
      day: row.day,
      typeDay: row.type_day,
      startWorkday: row.start_workday,
      endWorkday: row.end_workday,
      shift: row.shift,
      breakType: row.break_type,
      scheduledStartBreak: row.scheduled_start_break,
      scheduledEndBreak: row.scheduled_end_break,
      digitalSignature: row.digital_signature,
      signature: row.signature,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
