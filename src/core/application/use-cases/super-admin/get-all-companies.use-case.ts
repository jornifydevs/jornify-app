import type { CompanyRepository } from "@/core/domain/ports/repositories/company.repository";
import type { Company } from "@/core/domain/entities";

export class GetAllCompaniesUseCase {
  constructor(private companyRepo: CompanyRepository) {}

  async execute(): Promise<Company[]> {
    return this.companyRepo.findAll();
  }
}
