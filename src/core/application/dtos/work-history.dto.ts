import type { TimeRecord, Workday } from "../../domain/entities";

export type HistoryFilter = "today" | "week" | "month";

export interface HistoryPeriod {
  filter: HistoryFilter;
  offset: number; // 0 = actual, 1 = anterior, 2 = hace 2 periodos, etc.
}

export interface TimeRecordWithWorkday extends TimeRecord {
  workday: Workday;
}
