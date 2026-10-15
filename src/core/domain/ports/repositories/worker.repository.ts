import type { Worker } from "../../entities";

export interface CreateWorkerData {
  userId: string;
  centerId: string;
  dni: string;
  contractType: string;
  hourWeek: number;
  job: string;
  nss?: string;
}

export interface WorkerRepository {
  findById(id: string): Promise<Worker | null>;
  findByUserId(userId: string): Promise<Worker | null>;
  findAll(): Promise<Worker[]>;
  findByCenterId(centerId: string): Promise<Worker[]>;
  findByCenterIds(centerIds: string[]): Promise<Worker[]>;
  countAll(): Promise<number>;
  create(data: CreateWorkerData): Promise<Worker>;
  updateCenter(workerId: string, centerId: string): Promise<Worker>;
  delete(workerId: string): Promise<void>;
}
