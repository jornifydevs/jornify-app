import type { SupabaseClient } from "@supabase/supabase-js";
import type { InvitationCode } from "@/core/domain/entities";
import type {
  InvitationCodeRepository,
  CreateInvitationCodeData,
} from "@/core/domain/ports/repositories/invitation-code.repository";

interface InvitationCodeRow {
  id: string;
  company_id: string;
  code: string;
  status: "pending" | "used";
  created_by: string;
  used_by?: string | null;
  expires_at: string;
  created_at?: string;
}

export class SupabaseInvitationCodeRepository
  implements InvitationCodeRepository
{
  constructor(private supabase: SupabaseClient) {}

  async findByCode(code: string): Promise<InvitationCode | null> {
    const { data } = await this.supabase
      .from("invitation_code")
      .select("*")
      .eq("code", code)
      .single();
    return data ? this.toDomain(data) : null;
  }

  async findByCompanyId(companyId: string): Promise<InvitationCode[]> {
    const { data } = await this.supabase
      .from("invitation_code")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    return (data ?? []).map((row: InvitationCodeRow) => this.toDomain(row));
  }

  async create(data: CreateInvitationCodeData): Promise<InvitationCode> {
    const { data: row, error } = await this.supabase
      .from("invitation_code")
      .insert({
        company_id: data.companyId,
        code: data.code,
        created_by: data.createdBy,
        expires_at: data.expiresAt,
      })
      .select()
      .single();

    if (error || !row) {
      throw error ?? new Error("Error al crear el código de invitación");
    }
    return this.toDomain(row);
  }

  async consume(code: string, usedBy: string): Promise<void> {
    const { error } = await this.supabase
      .from("invitation_code")
      .update({ status: "used", used_by: usedBy })
      .eq("code", code)
      .eq("status", "pending");

    if (error) throw error;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("invitation_code")
      .delete()
      .eq("id", id)
      .eq("status", "pending");

    if (error) throw error;
  }

  private toDomain(row: InvitationCodeRow): InvitationCode {
    return {
      id: row.id,
      companyId: row.company_id,
      code: row.code,
      status: row.status,
      createdBy: row.created_by,
      usedBy: row.used_by ?? undefined,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
    };
  }
}
