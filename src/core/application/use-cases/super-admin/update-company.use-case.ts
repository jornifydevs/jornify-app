import type {
  CompanyRepository,
  UpdateCompanyData,
} from "@/core/domain/ports/repositories/company.repository";
import type { Company } from "@/core/domain/entities";
import { NotFoundError } from "@/core/domain/errors/domain-errors";

export class UpdateCompanyUseCase {
  constructor(private companyRepo: CompanyRepository) {}

  async execute(id: string, data: UpdateCompanyData): Promise<Company> {
    const existing = await this.companyRepo.findById(id);
    if (!existing) throw new NotFoundError("Empresa");

    return this.companyRepo.update(id, data);
  }
}
