import type { Center } from "@/core/domain/entities";

export interface CenterWithWorkerCount extends Center {
  workerCount: number;
}
