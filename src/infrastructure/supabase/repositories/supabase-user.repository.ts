import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@/core/domain/entities";
import type {
  UserRepository,
  CreateUserData,
  UpdateUserData,
} from "@/core/domain/ports/repositories/user.repository";
import { NotFoundError } from "@/core/domain/errors/domain-errors";

interface UserRow {
  id: string;
  name: string;
  last_name: string;
  email: string;
  phone?: string;
  dni?: string;
  role: string;
  company_id?: string;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseUserRepository implements UserRepository {
  constructor(private supabase: SupabaseClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const { data } = await this.supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    return data ? this.toDomain(data) : null;
  }

  async findById(id: string): Promise<User | null> {
    const { data } = await this.supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();

    return data ? this.toDomain(data) : null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];

    const { data } = await this.supabase
      .from("users")
      .select("*")
      .in("id", ids);

    return (data ?? []).map((row: UserRow) => this.toDomain(row));
  }

  async findWorkersByCompanyId(companyId: string): Promise<User[]> {
    const { data } = await this.supabase
      .from("users")
      .select("*")
      .eq("role", "worker")
      .eq("company_id", companyId);

    return (data ?? []).map((row: UserRow) => this.toDomain(row));
  }

  async create(data: CreateUserData): Promise<User> {
    // Insert without .select() to avoid depending on a SELECT RLS policy.
    // The caller already provides all the data we need to build the entity.
    const { error } = await this.supabase.from("users").insert({
      id: data.id,
      name: data.name,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      dni: data.dni,
      role: data.role,
      company_id: data.companyId,
    });

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      dni: data.dni,
      role: data.role as User["role"],
      companyId: data.companyId,
    };
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const updateData: Record<string, string | undefined> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.lastName !== undefined) updateData.last_name = data.lastName;
    if (data.phone !== undefined) updateData.phone = data.phone;

    const { data: updated, error } = await this.supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !updated) {
      throw new NotFoundError("Usuario");
    }

    return this.toDomain(updated);
  }

  async delete(userId: string): Promise<void> {
    await this.supabase.from("users").delete().eq("id", userId);
  }

  private toDomain(row: UserRow): User {
    return {
      id: row.id,
      name: row.name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      dni: row.dni,
      role: row.role as User["role"],
      companyId: row.company_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
