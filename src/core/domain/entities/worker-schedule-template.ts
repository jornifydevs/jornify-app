export interface WorkerScheduleTemplateDay {
  dayOfWeek: number; // 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  isWorkingDay: boolean;
  startWorkday: string; // "09:00:00"
  endWorkday: string; // "18:00:00"
  breakType?: string;
  scheduledStartBreak?: string;
  scheduledEndBreak?: string;
}

export interface WorkerScheduleTemplate {
  id: string;
  workerId: string;
  centerId: string;
  days: WorkerScheduleTemplateDay[]; // 7 entries, one per day of week
  createdAt?: string;
  updatedAt?: string;
}
