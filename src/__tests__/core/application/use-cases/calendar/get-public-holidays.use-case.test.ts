import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetPublicHolidaysUseCase } from "@/core/application/use-cases/calendar/get-public-holidays.use-case";
import type { HolidayService } from "@/core/domain/ports/services/holiday.service";
import type { PublicHoliday } from "@/core/domain/entities";

describe("GetPublicHolidaysUseCase", () => {
  let holidayService: HolidayService;
  let useCase: GetPublicHolidaysUseCase;

  const nationalHoliday: PublicHoliday = {
    date: "2026-01-01",
    localName: "Año Nuevo",
    name: "New Year's Day",
    countryCode: "ES",
    global: true,
    counties: null,
    types: ["Public"],
  };

  const regionalHolidayMadrid: PublicHoliday = {
    date: "2026-05-02",
    localName: "Fiesta de la Comunidad de Madrid",
    name: "Day of Madrid",
    countryCode: "ES",
    global: false,
    counties: ["ES-MD"],
    types: ["Public"],
  };

  const regionalHolidayCatalonia: PublicHoliday = {
    date: "2026-09-11",
    localName: "Diada Nacional de Catalunya",
    name: "National Day of Catalonia",
    countryCode: "ES",
    global: false,
    counties: ["ES-CT"],
    types: ["Public"],
  };

  const multiRegionHoliday: PublicHoliday = {
    date: "2026-04-02",
    localName: "Jueves Santo",
    name: "Maundy Thursday",
    countryCode: "ES",
    global: false,
    counties: ["ES-AN", "ES-MD", "ES-CL"],
    types: ["Public"],
  };

  beforeEach(() => {
    holidayService = {
      getPublicHolidays: vi.fn(),
    };
    useCase = new GetPublicHolidaysUseCase(holidayService);
  });

  it("should include national holidays regardless of subdivision code", async () => {
    vi.mocked(holidayService.getPublicHolidays).mockResolvedValue([
      nationalHoliday,
    ]);

    const result = await useCase.execute({
      year: 2026,
      month: 0,
      subdivisionCode: "ES-MD",
    });

    const jan1 = result.find((d) => d.date === "2026-01-01");
    expect(jan1).toBeDefined();
    expect(jan1!.holidays).toHaveLength(1);
    expect(jan1!.holidays[0].localName).toBe("Año Nuevo");
  });

  it("should include regional holidays matching the subdivision code", async () => {
    vi.mocked(holidayService.getPublicHolidays).mockResolvedValue([
      regionalHolidayMadrid,
    ]);

    const result = await useCase.execute({
      year: 2026,
      month: 4,
      subdivisionCode: "ES-MD",
    });

    const may2 = result.find((d) => d.date === "2026-05-02");
    expect(may2).toBeDefined();
    expect(may2!.holidays).toHaveLength(1);
    expect(may2!.holidays[0].localName).toBe(
      "Fiesta de la Comunidad de Madrid"
    );
  });

  it("should exclude regional holidays not matching the subdivision code", async () => {
    vi.mocked(holidayService.getPublicHolidays).mockResolvedValue([
      regionalHolidayCatalonia,
    ]);

    const result = await useCase.execute({
      year: 2026,
      month: 8,
      subdivisionCode: "ES-MD",
    });

    const sep11 = result.find((d) => d.date === "2026-09-11");
    expect(sep11).toBeDefined();
    expect(sep11!.holidays).toHaveLength(0);
  });

  it("should include multi-region holidays when subdivision matches", async () => {
    vi.mocked(holidayService.getPublicHolidays).mockResolvedValue([
      multiRegionHoliday,
    ]);

    const result = await useCase.execute({
      year: 2026,
      month: 3,
      subdivisionCode: "ES-MD",
    });

    const apr2 = result.find((d) => d.date === "2026-04-02");
    expect(apr2).toBeDefined();
    expect(apr2!.holidays).toHaveLength(1);
  });

  it("should only include national holidays when no subdivision code provided", async () => {
    vi.mocked(holidayService.getPublicHolidays).mockResolvedValue([
      nationalHoliday,
      regionalHolidayMadrid,
    ]);

    const result = await useCase.execute({
      year: 2026,
      month: 0,
    });

    const jan1 = result.find((d) => d.date === "2026-01-01");
    expect(jan1!.holidays).toHaveLength(1);

    const allHolidayDays = result.filter((d) => d.holidays.length > 0);
    expect(allHolidayDays).toHaveLength(1);
  });

  it("should return a grid with days from current month and padding", async () => {
    vi.mocked(holidayService.getPublicHolidays).mockResolvedValue([]);

    const result = await useCase.execute({
      year: 2026,
      month: 1,
    });

    // February 2026 has 28 days, starts on Sunday (index 6 in ISO week)
    // Grid should have padding days and total should be divisible by 7
    expect(result.length % 7).toBe(0);

    const currentMonthDays = result.filter((d) => d.isCurrentMonth);
    expect(currentMonthDays).toHaveLength(28);
  });

  it("should mark weekends correctly", async () => {
    vi.mocked(holidayService.getPublicHolidays).mockResolvedValue([]);

    const result = await useCase.execute({
      year: 2026,
      month: 1,
    });

    // Feb 7 2026 is a Saturday, Feb 8 is a Sunday
    const feb7 = result.find((d) => d.date === "2026-02-07");
    const feb8 = result.find((d) => d.date === "2026-02-08");
    const feb9 = result.find((d) => d.date === "2026-02-09");

    expect(feb7!.isWeekend).toBe(true);
    expect(feb8!.isWeekend).toBe(true);
    expect(feb9!.isWeekend).toBe(false);
  });

  it("should return empty holidays for a month with no holidays", async () => {
    vi.mocked(holidayService.getPublicHolidays).mockResolvedValue([
      nationalHoliday, // January only
    ]);

    const result = await useCase.execute({
      year: 2026,
      month: 6, // July
    });

    const daysWithHolidays = result.filter((d) => d.holidays.length > 0);
    expect(daysWithHolidays).toHaveLength(0);
  });

  it("should call holiday service with correct parameters", async () => {
    vi.mocked(holidayService.getPublicHolidays).mockResolvedValue([]);

    await useCase.execute({ year: 2026, month: 3 });

    expect(holidayService.getPublicHolidays).toHaveBeenCalledWith(2026, "ES");
    expect(holidayService.getPublicHolidays).toHaveBeenCalledTimes(1);
  });
});
