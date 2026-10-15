export type DayType = "normal" | "holiday" | "vacation" | "sick_leave";

export interface Workday {
  id: string;
  workerId: string;
  centerId: string;
  day: string;
  typeDay: string;
  startWorkday: string;
  endWorkday: string;
  shift?: string;
  breakType?: string;
  scheduledStartBreak?: string;
  scheduledEndBreak?: string;
  digitalSignature?: boolean;
  signature?: string;
  createdAt?: string;
  updatedAt?: string;
}
