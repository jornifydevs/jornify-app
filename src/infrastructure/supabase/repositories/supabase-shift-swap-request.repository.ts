import type { SupabaseClient } from "@supabase/supabase-js";
import type { ShiftSwapRequest, ShiftSwapStatus } from "@/core/domain/entities";
import type {
  ShiftSwapRequestRepository,
  CreateShiftSwapRequestData,
  UpdateShiftSwapRequestData,
} from "@/core/domain/ports/repositories/shift-swap-request.repository";

interface ShiftSwapRequestRow {
  id: string;
  requester_id: string;
  target_id: string;
  requester_workday_id: string;
  target_workday_id: string;
  center_id: string;
  status: string;
  requester_note?: string;
  admin_note?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseShiftSwapRequestRepository
  implements ShiftSwapRequestRepository
{
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<ShiftSwapRequest | null> {
    const { data } = await this.supabase
      .from("shift_swap_request")
      .select("*")
      .eq("id", id)
      .single();

    return data ? this.toDomain(data) : null;
  }

  async findByWorkerId(workerId: string): Promise<ShiftSwapRequest[]> {
    const { data } = await this.supabase
      .from("shift_swap_request")
      .select("*")
      .or(`requester_id.eq.${workerId},target_id.eq.${workerId}`)
      .order("created_at", { ascending: false });

    return (data ?? []).map((row: ShiftSwapRequestRow) => this.toDomain(row));
  }

  async findPendingByWorkdayId(
    workdayId: string
  ): Promise<ShiftSwapRequest | null> {
    const { data } = await this.supabase
      .from("shift_swap_request")
      .select("*")
      .or(
        `requester_workday_id.eq.${workdayId},target_workday_id.eq.${workdayId}`
      )
      .eq("status", "pending")
      .maybeSingle();

    return data ? this.toDomain(data) : null;
  }

  async findPendingByCenterId(centerId: string): Promise<ShiftSwapRequest[]> {
    const { data } = await this.supabase
      .from("shift_swap_request")
      .select("*")
      .eq("center_id", centerId)
      .eq("status", "awaiting_admin")
      .order("created_at", { ascending: true });

    return (data ?? []).map((row: ShiftSwapRequestRow) => this.toDomain(row));
  }

  async findHistoryByWorkerId(workerId: string): Promise<ShiftSwapRequest[]> {
    const { data } = await this.supabase
      .from("shift_swap_request")
      .select("*")
      .or(`requester_id.eq.${workerId},target_id.eq.${workerId}`)
      .in("status", ["approved", "rejected", "cancelled"])
      .order("created_at", { ascending: false });

    return (data ?? []).map((row: ShiftSwapRequestRow) => this.toDomain(row));
  }

  async create(data: CreateShiftSwapRequestData): Promise<ShiftSwapRequest> {
    const { data: row, error } = await this.supabase
      .from("shift_swap_request")
      .insert({
        requester_id: data.requesterId,
        target_id: data.targetId,
        requester_workday_id: data.requesterWorkdayId,
        target_workday_id: data.targetWorkdayId,
        center_id: data.centerId,
        requester_note: data.requesterNote,
      })
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(row);
  }

  async update(
    id: string,
    data: UpdateShiftSwapRequestData
  ): Promise<ShiftSwapRequest> {
    const payload: Record<string, unknown> = {};
    if (data.status !== undefined) payload.status = data.status;
    if (data.adminNote !== undefined) payload.admin_note = data.adminNote;
    if (data.reviewedBy !== undefined) payload.reviewed_by = data.reviewedBy;
    if (data.reviewedAt !== undefined) payload.reviewed_at = data.reviewedAt;

    const { data: row, error } = await this.supabase
      .from("shift_swap_request")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(row);
  }

  private toDomain(row: ShiftSwapRequestRow): ShiftSwapRequest {
    return {
      id: row.id,
      requesterId: row.requester_id,
      targetId: row.target_id,
      requesterWorkdayId: row.requester_workday_id,
      targetWorkdayId: row.target_workday_id,
      centerId: row.center_id,
      status: row.status as ShiftSwapStatus,
      requesterNote: row.requester_note,
      adminNote: row.admin_note,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
