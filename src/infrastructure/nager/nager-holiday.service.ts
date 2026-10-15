import type { PublicHoliday } from "@/core/domain/entities";
import type { HolidayService } from "@/core/domain/ports/services/holiday.service";

const NAGER_BASE_URL = "https://date.nager.at/api/v3";

interface NagerHolidayResponse {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties: string[] | null;
  launchYear: number | null;
  types: string[];
}

export class NagerHolidayService implements HolidayService {
  async getPublicHolidays(
    year: number,
    countryCode: string
  ): Promise<PublicHoliday[]> {
    const response = await fetch(
      `${NAGER_BASE_URL}/PublicHolidays/${year}/${countryCode}`
    );

    if (!response.ok) {
      return [];
    }

    const data: NagerHolidayResponse[] = await response.json();

    return data.map((h) => ({
      date: h.date,
      localName: h.localName,
      name: h.name,
      countryCode: h.countryCode,
      global: h.global,
      counties: h.counties,
      types: h.types,
    }));
  }
}
