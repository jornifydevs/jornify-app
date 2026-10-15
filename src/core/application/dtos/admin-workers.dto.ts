import type { Worker } from "@/core/domain/entities";

export interface WorkerWithUser {
  worker: Worker;
  userName: string;
  userLastName: string;
  userEmail: string;
  centerName: string;
}

export interface WorkerDetailDTO {
  worker: Worker;
  userName: string;
  userLastName: string;
  userEmail: string;
  userPhone?: string;
  userImg?: string;
  centerName: string;
  recentRecords: WorkerRecentRecord[];
}

export interface WorkerRecentRecord {
  day: string;
  typeDay: string;
  startHour?: string;
  endHour?: string;
  totalHour?: string;
  breakStartHour?: string;
  breakEndHour?: string;
  breakTotalHour?: string;
}
