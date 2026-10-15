import type { PublicHoliday } from "@/core/domain/entities";

export interface HolidayService {
  getPublicHolidays(
    year: number,
    countryCode: string
  ): Promise<PublicHoliday[]>;
}
