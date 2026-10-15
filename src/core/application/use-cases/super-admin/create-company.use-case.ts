import type {
  CompanyRepository,
  CreateCompanyData,
} from "@/core/domain/ports/repositories/company.repository";
import type { Company } from "@/core/domain/entities";
import { ValidationError } from "@/core/domain/errors/domain-errors";

export class CreateCompanyUseCase {
  constructor(private companyRepo: CompanyRepository) {}

  async execute(data: CreateCompanyData): Promise<Company> {
    if (!data.nif || !data.name || !data.email) {
      throw new ValidationError("NIF, nombre y email son obligatorios");
    }

    return this.companyRepo.create(data);
  }
}
