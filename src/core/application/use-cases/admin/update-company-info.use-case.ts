import type { CompanyRepository } from "@/core/domain/ports/repositories/company.repository";
import type { Company } from "@/core/domain/entities";

export interface UpdateCompanyInfoInput {
  name?: string;
  businessName?: string;
  address?: string;
  email?: string;
  nationality?: string;
  logo?: string;
}

export class UpdateCompanyInfoUseCase {
  constructor(private companyRepo: CompanyRepository) {}

  async execute(
    companyId: string,
    data: UpdateCompanyInfoInput
  ): Promise<Company> {
    return this.companyRepo.update(companyId, data);
  }
}
