import type { Company } from "../../entities";

export type CreateCompanyData = Omit<Company, "id" | "createdAt" | "updatedAt">;

export type UpdateCompanyData = Partial<
  Omit<Company, "id" | "createdAt" | "updatedAt">
>;

export interface CompanyRepository {
  findById(id: string): Promise<Company | null>;
  findAll(): Promise<Company[]>;
  create(data: CreateCompanyData): Promise<Company>;
  update(id: string, data: UpdateCompanyData): Promise<Company>;
  delete(id: string): Promise<void>;
}
