import type { SupabaseClient } from "@supabase/supabase-js";
import type { Center, CenterFeature, BreakType } from "@/core/domain/entities";
import type {
  CenterRepository,
  CreateCenterData,
  UpdateCenterData,
} from "@/core/domain/ports/repositories/center.repository";

interface CenterRow {
  id: string;
  company_id: string;
  name: string;
  phone?: string;
  address: string;
  location?: string;
  nationality?: string;
  email?: string;
  total_worker?: number;
  enabled_features?: string[];
  allowed_day_types?: string[];
  default_start_workday: string;
  default_end_workday: string;
  break_type: string;
  default_start_break?: string;
  default_end_break?: string;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseCenterRepository implements CenterRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Center | null> {
    const { data } = await this.supabase
      .from("center")
      .select("*")
      .eq("id", id)
      .single();

    return data ? this.toDomain(data) : null;
  }

  async findAll(): Promise<Center[]> {
    const { data } = await this.supabase
      .from("center")
      .select("*")
      .order("name", { ascending: true });

    return (data ?? []).map((row: CenterRow) => this.toDomain(row));
  }

  async findByCompanyId(companyId: string): Promise<Center[]> {
    const { data } = await this.supabase
      .from("center")
      .select("*")
      .eq("company_id", companyId)
      .order("name", { ascending: true });

    return (data ?? []).map((row: CenterRow) => this.toDomain(row));
  }

  async countAll(): Promise<number> {
    const { count } = await this.supabase
      .from("center")
      .select("*", { count: "exact", head: true });

    return count ?? 0;
  }

  async create(data: CreateCenterData): Promise<Center> {
    const id = crypto.randomUUID();

    const { error } = await this.supabase.from("center").insert({
      id,
      company_id: data.companyId,
      name: data.name,
      phone: data.phone,
      address: data.address,
      location: data.location,
      nationality: data.nationality,
      email: data.email,
      default_start_workday: "09:00:00",
      default_end_workday: "18:00:00",
      break_type: "none",
      enabled_features: data.enabledFeatures ?? [],
      allowed_day_types: data.allowedDayTypes ?? [],
    });

    if (error) {
      throw error;
    }

    return {
      id,
      companyId: data.companyId,
      name: data.name,
      phone: data.phone,
      address: data.address ?? "",
      location: data.location,
      nationality: data.nationality,
      email: data.email,
      enabledFeatures: (data.enabledFeatures ?? []) as CenterFeature[],
      allowedDayTypes: data.allowedDayTypes ?? [],
      defaultStartWorkday: "09:00:00",
      defaultEndWorkday: "18:00:00",
      breakType: "none" as BreakType,
    };
  }

  async update(id: string, data: UpdateCenterData): Promise<Center> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.nationality !== undefined)
      updateData.nationality = data.nationality;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.enabledFeatures !== undefined)
      updateData.enabled_features = data.enabledFeatures;
    if (data.allowedDayTypes !== undefined)
      updateData.allowed_day_types = data.allowedDayTypes;
    if (data.defaultStartWorkday !== undefined)
      updateData.default_start_workday = data.defaultStartWorkday;
    if (data.defaultEndWorkday !== undefined)
      updateData.default_end_workday = data.defaultEndWorkday;
    if (data.breakType !== undefined) updateData.break_type = data.breakType;
    if (data.defaultStartBreak !== undefined)
      updateData.default_start_break = data.defaultStartBreak;
    if (data.defaultEndBreak !== undefined)
      updateData.default_end_break = data.defaultEndBreak;

    const { data: updated, error } = await this.supabase
      .from("center")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) {
      throw new Error("Error al actualizar centro");
    }

    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("center").delete().eq("id", id);

    if (error) {
      throw new Error("Error al eliminar el centro");
    }
  }

  private toDomain(row: CenterRow): Center {
    return {
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      phone: row.phone,
      address: row.address,
      location: row.location,
      nationality: row.nationality,
      email: row.email,
      totalWorker: row.total_worker,
      enabledFeatures: (row.enabled_features ?? []) as CenterFeature[],
      allowedDayTypes: row.allowed_day_types ?? [],
      defaultStartWorkday: row.default_start_workday,
      defaultEndWorkday: row.default_end_workday,
      breakType: row.break_type as BreakType,
      defaultStartBreak: row.default_start_break,
      defaultEndBreak: row.default_end_break,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
