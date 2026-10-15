export type ContractType =
  | "full_time"
  | "part_time"
  | "temporary"
  | "internship";

export interface Worker {
  id: string;
  userId: string;
  centerId: string;
  dni: string;
  contractType: string;
  hourWeek: number;
  job: string;
  nss?: string;
  documentId?: string;
  createdAt?: string;
  updatedAt?: string;
}
