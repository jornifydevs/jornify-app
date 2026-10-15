export type UserRole = "super_admin" | "admin" | "worker";

export interface User {
  id: string;
  name: string;
  lastName: string;
  email: string;
  phone?: string;
  dni?: string;
  role: UserRole;
  companyId?: string;
  createdAt?: string;
  updatedAt?: string;
}
