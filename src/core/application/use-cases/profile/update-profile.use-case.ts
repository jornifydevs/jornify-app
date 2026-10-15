import type { User } from "@/core/domain/entities";
import type { UserRepository } from "@/core/domain/ports/repositories/user.repository";
import type { UpdateProfileDTO } from "../../dtos/profile.dto";
import { ValidationError } from "@/core/domain/errors/domain-errors";

export class UpdateProfileUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(userId: string, data: UpdateProfileDTO): Promise<User> {
    if (data.name !== undefined && data.name.trim() === "") {
      throw new ValidationError("El nombre no puede estar vacío");
    }

    if (data.lastName !== undefined && data.lastName.trim() === "") {
      throw new ValidationError("El apellido no puede estar vacío");
    }

    return this.userRepo.update(userId, {
      name: data.name?.trim(),
      lastName: data.lastName?.trim(),
      phone: data.phone?.trim(),
    });
  }
}
