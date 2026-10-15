export interface TimeRecord {
  id: string;
  workdayId: string;
  startHour?: string;
  endHour?: string;
  totalHour?: string;
  breakStartHour?: string;
  breakEndHour?: string;
  breakTotalHour?: string;
  createdAt?: string;
  updatedAt?: string;
}
