import type { SupabaseClient } from "@supabase/supabase-js";
import type { Company } from "@/core/domain/entities";
import type {
  CompanyRepository,
  CreateCompanyData,
  UpdateCompanyData,
} from "@/core/domain/ports/repositories/company.repository";

interface CompanyRow {
  id: string;
  nif: string;
  name: string;
  business_name: string;
  address: string;
  email: string;
  nationality?: string;
  logo?: string;
  codigo_cuenta_cotizacion?: string;
  created_at?: string;
  updated_at?: string;
}

export class SupabaseCompanyRepository implements CompanyRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: string): Promise<Company | null> {
    const { data } = await this.supabase
      .from("company")
      .select("*")
      .eq("id", id)
      .single();

    return data ? this.toDomain(data) : null;
  }

  async findAll(): Promise<Company[]> {
    const { data } = await this.supabase
      .from("company")
      .select("*")
      .order("name", { ascending: true });

    return (data ?? []).map((row: CompanyRow) => this.toDomain(row));
  }

  async create(data: CreateCompanyData): Promise<Company> {
    // Generate the ID here so we can return the entity without needing a
    // SELECT after INSERT (which requires a separate RLS SELECT policy).
    const id = crypto.randomUUID();

    const { error } = await this.supabase.from("company").insert({
      id,
      nif: data.nif,
      name: data.name,
      business_name: data.businessName,
      address: data.address,
      email: data.email,
      nationality: data.nationality,
      logo: data.logo,
      codigo_cuenta_cotizacion: data.codigoCuentaCotizacion,
    });

    if (error) throw error;

    return {
      id,
      nif: data.nif,
      name: data.name,
      businessName: data.businessName,
      address: data.address,
      email: data.email,
      nationality: data.nationality,
      logo: data.logo,
    };
  }

  async update(id: string, data: UpdateCompanyData): Promise<Company> {
    const updateData: Record<string, string | undefined> = {};

    if (data.nif !== undefined) updateData.nif = data.nif;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.businessName !== undefined)
      updateData.business_name = data.businessName;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.nationality !== undefined)
      updateData.nationality = data.nationality;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.codigoCuentaCotizacion !== undefined)
      updateData.codigo_cuenta_cotizacion = data.codigoCuentaCotizacion;

    const { data: updated, error } = await this.supabase
      .from("company")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error || !updated)
      throw error ?? new Error("Error al actualizar empresa");
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("company").delete().eq("id", id);

    if (error) throw error;
  }

  private toDomain(row: CompanyRow): Company {
    return {
      id: row.id,
      nif: row.nif,
      name: row.name,
      businessName: row.business_name,
      address: row.address,
      email: row.email,
      nationality: row.nationality,
      logo: row.logo,
      codigoCuentaCotizacion: row.codigo_cuenta_cotizacion,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
