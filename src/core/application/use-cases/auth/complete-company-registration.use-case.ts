import type { UserRepository } from "@/core/domain/ports/repositories/user.repository";
import type { CompanyRepository } from "@/core/domain/ports/repositories/company.repository";
import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import type { User } from "@/core/domain/entities";

interface CompleteCompanyRegistrationInput {
  userId: string;
  adminName: string;
  adminLastName: string;
  email: string;
  nif: string;
  companyName: string;
  businessName: string;
  address: string;
  companyEmail: string;
  nationality?: string;
  enabledFeatures?: string[];
  allowedDayTypes?: string[];
}

export class CompleteCompanyRegistrationUseCase {
  constructor(
    private companyRepo: CompanyRepository,
    private userRepo: UserRepository,
    private centerRepo: CenterRepository
  ) {}

  async execute(input: CompleteCompanyRegistrationInput): Promise<User> {
    const {
      userId,
      adminName,
      adminLastName,
      email,
      nif,
      companyName,
      businessName,
      address,
      companyEmail,
      nationality,
      enabledFeatures = [],
      allowedDayTypes = [],
    } = input;

    // Idempotency: if admin profile already exists, skip creation
    const existing = await this.userRepo.findById(userId);
    if (existing) return existing;

    // Create the company record
    const company = await this.companyRepo.create({
      nif,
      name: companyName,
      businessName,
      address,
      email: companyEmail,
      nationality,
    });

    // Create the admin user profile linked to the new company
    const user = await this.userRepo.create({
      id: userId,
      name: adminName,
      lastName: adminLastName,
      email,
      role: "admin",
      companyId: company.id,
    });

    // Create a default center for the company using the plan features.
    // Non-fatal: if this fails (e.g. RLS not yet configured), the admin user
    // is already created and can add the center manually from the dashboard.
    try {
      await this.centerRepo.create({
        companyId: company.id,
        name: companyName,
        address,
        enabledFeatures,
        allowedDayTypes,
      });
    } catch (centerError) {
      console.error(
        `[CompleteCompanyRegistrationUseCase] default center creation failed for companyId="${company.id}":`,
        centerError
      );
    }

    return user;
  }
}
