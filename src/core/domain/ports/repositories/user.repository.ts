import type { User, UserRole } from "../../entities";

export interface CreateUserData {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone?: string;
  dni?: string;
  role: UserRole;
  companyId?: string;
}

export interface UpdateUserData {
  name?: string;
  lastName?: string;
  phone?: string;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findByIds(ids: string[]): Promise<User[]>;
  findWorkersByCompanyId(companyId: string): Promise<User[]>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(userId: string): Promise<void>;
}
