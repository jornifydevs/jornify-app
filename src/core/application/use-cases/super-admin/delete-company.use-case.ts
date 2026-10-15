import type { CompanyRepository } from "@/core/domain/ports/repositories/company.repository";
import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import {
  NotFoundError,
  ValidationError,
} from "@/core/domain/errors/domain-errors";

export class DeleteCompanyUseCase {
  constructor(
    private companyRepo: CompanyRepository,
    private centerRepo: CenterRepository
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.companyRepo.findById(id);
    if (!existing) throw new NotFoundError("Empresa");

    const centers = await this.centerRepo.findByCompanyId(id);
    if (centers.length > 0) {
      throw new ValidationError(
        "No se puede eliminar una empresa con centros asociados"
      );
    }

    await this.companyRepo.delete(id);
  }
}
