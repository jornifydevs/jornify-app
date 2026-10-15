export interface AttendanceRecord {
  workerId: string;
  workerName: string;
  workerLastName: string;
  centerName: string;
  day: string;
  typeDay: string;
  startHour?: string;
  endHour?: string;
  totalHour?: string;
  breakStartHour?: string;
  breakEndHour?: string;
  breakTotalHour?: string;
}

export interface AttendanceReportInput {
  companyId: string;
  startDate: string;
  endDate: string;
  centerId?: string;
}
