import type { LocalHoliday } from "@/core/domain/entities";

export interface LocalHolidayRepository {
  findByCenterIdAndYear(
    centerId: string,
    year: number
  ): Promise<LocalHoliday[]>;
  create(centerId: string, date: string, name: string): Promise<LocalHoliday>;
  delete(id: string): Promise<void>;
}
