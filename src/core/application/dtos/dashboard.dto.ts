import type { User, Worker } from "../../domain/entities";

export interface AdminDashboardDTO {
  totalWorkers: number;
  totalCenters: number;
  activeToday: number;
}

export interface WorkerDashboardDTO {
  user: User;
  worker: Worker;
}
