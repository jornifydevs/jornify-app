import type { LocalHoliday } from "@/core/domain/entities";
import type { LocalHolidayRepository } from "@/core/domain/ports/repositories/local-holiday.repository";
import { ValidationError } from "@/core/domain/errors/domain-errors";

export class GetLocalHolidaysUseCase {
  constructor(private localHolidayRepo: LocalHolidayRepository) {}

  async execute(centerId: string, year: number): Promise<LocalHoliday[]> {
    return this.localHolidayRepo.findByCenterIdAndYear(centerId, year);
  }
}

export class CreateLocalHolidayUseCase {
  constructor(private localHolidayRepo: LocalHolidayRepository) {}

  async execute(
    centerId: string,
    date: string,
    name: string
  ): Promise<LocalHoliday> {
    if (!date || !name.trim()) {
      throw new ValidationError("La fecha y el nombre son obligatorios");
    }

    return this.localHolidayRepo.create(centerId, date, name.trim());
  }
}

export class DeleteLocalHolidayUseCase {
  constructor(private localHolidayRepo: LocalHolidayRepository) {}

  async execute(id: string): Promise<void> {
    return this.localHolidayRepo.delete(id);
  }
}
