import type { Center } from "../../entities";

export interface CreateCenterData {
  companyId: string;
  name: string;
  phone?: string;
  address: string;
  location?: string;
  nationality?: string;
  email?: string;
  enabledFeatures?: string[];
  allowedDayTypes?: string[];
}

export type UpdateCenterData = {
  // Basic info
  name?: string;
  phone?: string;
  address?: string;
  location?: string;
  nationality?: string;
  email?: string;
  // Schedule / features
  enabledFeatures?: string[];
  allowedDayTypes?: string[];
  defaultStartWorkday?: string;
  defaultEndWorkday?: string;
  breakType?: string;
  defaultStartBreak?: string;
  defaultEndBreak?: string;
};

export interface CenterRepository {
  findById(id: string): Promise<Center | null>;
  findAll(): Promise<Center[]>;
  findByCompanyId(companyId: string): Promise<Center[]>;
  countAll(): Promise<number>;
  create(data: CreateCenterData): Promise<Center>;
  update(id: string, data: UpdateCenterData): Promise<Center>;
  delete(id: string): Promise<void>;
}
