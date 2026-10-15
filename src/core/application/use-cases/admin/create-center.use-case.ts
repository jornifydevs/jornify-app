import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import type { Center } from "@/core/domain/entities";
import { ValidationError } from "@/core/domain/errors/domain-errors";

interface CreateCenterInput {
  companyId: string;
  name: string;
  phone?: string;
  address: string;
  location?: string;
  email?: string;
}

export class CreateCenterUseCase {
  constructor(private centerRepo: CenterRepository) {}

  async execute(input: CreateCenterInput): Promise<Center> {
    const { companyId, name, address, phone, location, email } = input;

    if (!name.trim()) {
      throw new ValidationError("El nombre del centro es obligatorio");
    }

    if (!address.trim()) {
      throw new ValidationError("La dirección del centro es obligatoria");
    }

    return this.centerRepo.create({
      companyId,
      name: name.trim(),
      phone: phone?.trim() || undefined,
      address: address.trim(),
      location: location?.trim() || undefined,
      email: email?.trim() || undefined,
    });
  }
}
