import type { WorkerScheduleTemplateRepository } from "../../../domain/ports/repositories/worker-schedule-template.repository";
import type { WorkdayRepository } from "../../../domain/ports/repositories/workday.repository";
import type { WorkerScheduleTemplateDay } from "../../../domain/entities";

export interface GenerateWorkdaysInput {
  workerId: string;
  centerId: string;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  centerDefaultStart: string; // "09:00:00"
  centerDefaultEnd: string; // "18:00:00"
  centerBreakType?: string;
  centerDefaultStartBreak?: string;
  centerDefaultEndBreak?: string;
}

export interface GenerateWorkdaysResult {
  created: number;
  skipped: number;
}

const DEFAULT_WORKING_DAYS = [1, 2, 3, 4, 5]; // Mon-Fri

function buildDefaultDays(
  centerDefaultStart: string,
  centerDefaultEnd: string,
  centerBreakType?: string,
  centerDefaultStartBreak?: string,
  centerDefaultEndBreak?: string
): WorkerScheduleTemplateDay[] {
  return [0, 1, 2, 3, 4, 5, 6].map((dow) => ({
    dayOfWeek: dow,
    isWorkingDay: DEFAULT_WORKING_DAYS.includes(dow),
    startWorkday: centerDefaultStart,
    endWorkday: centerDefaultEnd,
    breakType: centerBreakType,
    scheduledStartBreak: centerDefaultStartBreak,
    scheduledEndBreak: centerDefaultEndBreak,
  }));
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + "T00:00:00").getDay();
}

export class GenerateWorkdaysFromTemplateUseCase {
  constructor(
    private templateRepo: WorkerScheduleTemplateRepository,
    private workdayRepo: WorkdayRepository
  ) {}

  async execute(input: GenerateWorkdaysInput): Promise<GenerateWorkdaysResult> {
    const template = await this.templateRepo.findByWorkerId(input.workerId);

    const days: WorkerScheduleTemplateDay[] = template
      ? template.days
      : buildDefaultDays(
          input.centerDefaultStart,
          input.centerDefaultEnd,
          input.centerBreakType,
          input.centerDefaultStartBreak,
          input.centerDefaultEndBreak
        );

    const existingWorkdays = await this.workdayRepo.findByWorkerInDateRange(
      input.workerId,
      input.startDate,
      input.endDate
    );
    const existingDates = new Set(existingWorkdays.map((w) => w.day));

    const templateByDow = new Map(days.map((d) => [d.dayOfWeek, d]));

    const toCreate: Array<{
      workerId: string;
      centerId: string;
      day: string;
      typeDay: string;
      startWorkday: string;
      endWorkday: string;
      breakType?: string;
      scheduledStartBreak?: string;
      scheduledEndBreak?: string;
    }> = [];

    let current = input.startDate;
    while (current <= input.endDate) {
      if (!existingDates.has(current)) {
        const dow = getDayOfWeek(current);
        const dayConfig = templateByDow.get(dow);
        if (dayConfig?.isWorkingDay) {
          toCreate.push({
            workerId: input.workerId,
            centerId: input.centerId,
            day: current,
            typeDay: "normal",
            startWorkday: dayConfig.startWorkday,
            endWorkday: dayConfig.endWorkday,
            breakType: dayConfig.breakType,
            scheduledStartBreak: dayConfig.scheduledStartBreak,
            scheduledEndBreak: dayConfig.scheduledEndBreak,
          });
        }
      }
      current = addDays(current, 1);
    }

    if (toCreate.length > 0) {
      await this.workdayRepo.createMany(toCreate);
    }

    return {
      created: toCreate.length,
      skipped: existingDates.size,
    };
  }
}
