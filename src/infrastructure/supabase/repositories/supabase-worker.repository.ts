import type { SupabaseClient } from "@supabase/supabase-js";
import type { Worker } from "@/core/domain/entities";
import type {
  WorkerRepository,
  CreateWorkerData,
} from "@/core/domain/ports/repositories/worker.repository";

interface WorkerRow {
  id: string;
  user_id: string;
  center_id: string;
  dni: string;
  contract_type: string;
  hour_week: number;
  job: string;
  nss?: string;
  document_id?: string;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseWorkerRepository implements WorkerRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Worker | null> {
    const { data } = await this.supabase
      .from("worker")
      .select("*")
      .eq("id", id)
      .single();

    return data ? this.toDomain(data) : null;
  }

  async findByUserId(userId: string): Promise<Worker | null> {
    const { data } = await this.supabase
      .from("worker")
      .select("*")
      .eq("user_id", userId)
      .single();

    return data ? this.toDomain(data) : null;
  }

  async findAll(): Promise<Worker[]> {
    const { data } = await this.supabase
      .from("worker")
      .select("*")
      .order("created_at", { ascending: false });

    return (data ?? []).map((row: WorkerRow) => this.toDomain(row));
  }

  async findByCenterId(centerId: string): Promise<Worker[]> {
    const { data } = await this.supabase
      .from("worker")
      .select("*")
      .eq("center_id", centerId);

    return (data ?? []).map((row: WorkerRow) => this.toDomain(row));
  }

  async findByCenterIds(centerIds: string[]): Promise<Worker[]> {
    if (centerIds.length === 0) return [];

    const { data } = await this.supabase
      .from("worker")
      .select("*")
      .in("center_id", centerIds)
      .order("created_at", { ascending: false });

    return (data ?? []).map((row: WorkerRow) => this.toDomain(row));
  }

  async countAll(): Promise<number> {
    const { count } = await this.supabase
      .from("worker")
      .select("*", { count: "exact", head: true });

    return count ?? 0;
  }

  async create(data: CreateWorkerData): Promise<Worker> {
    const { data: row, error } = await this.supabase
      .from("worker")
      .insert({
        user_id: data.userId,
        center_id: data.centerId,
        dni: data.dni,
        contract_type: data.contractType,
        hour_week: data.hourWeek,
        job: data.job,
        nss: data.nss,
      })
      .select()
      .single();

    if (error || !row) {
      throw error ?? new Error("Error al crear el registro de trabajador");
    }
    return this.toDomain(row);
  }

  async updateCenter(workerId: string, centerId: string): Promise<Worker> {
    const { data: row, error } = await this.supabase
      .from("worker")
      .update({ center_id: centerId })
      .eq("id", workerId)
      .select()
      .single();

    if (error || !row) {
      throw error ?? new Error("Error al actualizar el centro del trabajador");
    }
    return this.toDomain(row);
  }

  async delete(workerId: string): Promise<void> {
    const { error } = await this.supabase
      .from("worker")
      .delete()
      .eq("id", workerId);

    if (error) throw error;
  }

  private toDomain(row: WorkerRow): Worker {
    return {
      id: row.id,
      userId: row.user_id,
      centerId: row.center_id,
      dni: row.dni,
      contractType: row.contract_type,
      hourWeek: row.hour_week,
      job: row.job,
      nss: row.nss,
      documentId: row.document_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
