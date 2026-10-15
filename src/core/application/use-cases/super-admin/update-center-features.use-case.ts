import type {
  CenterRepository,
  UpdateCenterData,
} from "@/core/domain/ports/repositories/center.repository";
import type { Center } from "@/core/domain/entities";
import { NotFoundError } from "@/core/domain/errors/domain-errors";

export class UpdateCenterFeaturesUseCase {
  constructor(private centerRepo: CenterRepository) {}

  async execute(centerId: string, data: UpdateCenterData): Promise<Center> {
    const existing = await this.centerRepo.findById(centerId);
    if (!existing) throw new NotFoundError("Centro");

    return this.centerRepo.update(centerId, data);
  }
}
