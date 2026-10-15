import type { SupabaseClient } from "@supabase/supabase-js";
import type { LocalHoliday } from "@/core/domain/entities";
import type { LocalHolidayRepository } from "@/core/domain/ports/repositories/local-holiday.repository";

interface LocalHolidayRow {
  id: string;
  center_id: string;
  date: string;
  name: string;
  created_at?: string;
}

export class SupabaseLocalHolidayRepository implements LocalHolidayRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByCenterIdAndYear(
    centerId: string,
    year: number
  ): Promise<LocalHoliday[]> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data } = await this.supabase
      .from("local_holiday")
      .select("*")
      .eq("center_id", centerId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    return (data ?? []).map((row: LocalHolidayRow) => this.toDomain(row));
  }

  async create(
    centerId: string,
    date: string,
    name: string
  ): Promise<LocalHoliday> {
    const { data, error } = await this.supabase
      .from("local_holiday")
      .insert({ center_id: centerId, date, name })
      .select()
      .single();

    if (error || !data) {
      throw new Error("Error al crear el festivo local");
    }

    return this.toDomain(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("local_holiday")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error("Error al eliminar el festivo local");
    }
  }

  private toDomain(row: LocalHolidayRow): LocalHoliday {
    return {
      id: row.id,
      centerId: row.center_id,
      date: row.date,
      name: row.name,
      createdAt: row.created_at,
    };
  }
}
