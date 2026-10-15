import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompleteCompanyRegistrationUseCase } from "@/core/application/use-cases/auth/complete-company-registration.use-case";
import type { UserRepository } from "@/core/domain/ports/repositories/user.repository";
import type { CompanyRepository } from "@/core/domain/ports/repositories/company.repository";
import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import type { User, Company, Center } from "@/core/domain/entities";

const mockCompany: Company = {
  id: "company-1",
  nif: "B12345678",
  name: "Mi Empresa S.L.",
  businessName: "Mi Marca",
  address: "Calle Principal 1",
  email: "empresa@email.com",
};

const mockAdmin: User = {
  id: "user-1",
  name: "María",
  lastName: "López",
  email: "empresa@email.com",
  role: "admin",
  companyId: "company-1",
};

const mockCenter: Center = {
  id: "center-1",
  companyId: "company-1",
  name: "Mi Empresa S.L.",
  address: "Calle Principal 1",
  enabledFeatures: [],
  allowedDayTypes: [],
  defaultStartWorkday: "09:00:00",
  defaultEndWorkday: "18:00:00",
  breakType: "none",
};

const defaultInput = {
  userId: "user-1",
  adminName: "María",
  adminLastName: "López",
  email: "empresa@email.com",
  nif: "B12345678",
  companyName: "Mi Empresa S.L.",
  businessName: "Mi Marca",
  address: "Calle Principal 1",
  companyEmail: "empresa@email.com",
};

describe("CompleteCompanyRegistrationUseCase", () => {
  let companyRepo: CompanyRepository;
  let userRepo: UserRepository;
  let centerRepo: CenterRepository;
  let useCase: CompleteCompanyRegistrationUseCase;

  beforeEach(() => {
    companyRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    userRepo = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findWorkersByCompanyId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    centerRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
      findByCompanyId: vi.fn(),
      countAll: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    useCase = new CompleteCompanyRegistrationUseCase(
      companyRepo,
      userRepo,
      centerRepo
    );
  });

  it("creates company, admin user and default center", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    vi.mocked(companyRepo.create).mockResolvedValue(mockCompany);
    vi.mocked(userRepo.create).mockResolvedValue(mockAdmin);
    vi.mocked(centerRepo.create).mockResolvedValue(mockCenter);

    const result = await useCase.execute(defaultInput);

    expect(companyRepo.create).toHaveBeenCalledWith({
      nif: "B12345678",
      name: "Mi Empresa S.L.",
      businessName: "Mi Marca",
      address: "Calle Principal 1",
      email: "empresa@email.com",
    });
    expect(userRepo.create).toHaveBeenCalledWith({
      id: "user-1",
      name: "María",
      lastName: "López",
      email: "empresa@email.com",
      role: "admin",
      companyId: "company-1",
    });
    expect(centerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-1",
        name: "Mi Empresa S.L.",
        address: "Calle Principal 1",
      })
    );
    expect(result).toEqual(mockAdmin);
  });

  it("applies plan features to the default center", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    vi.mocked(companyRepo.create).mockResolvedValue(mockCompany);
    vi.mocked(userRepo.create).mockResolvedValue(mockAdmin);
    vi.mocked(centerRepo.create).mockResolvedValue(mockCenter);

    const features = ["profile", "payroll"];
    const dayTypes = ["normal", "holiday"];

    await useCase.execute({
      ...defaultInput,
      enabledFeatures: features,
      allowedDayTypes: dayTypes,
    });

    expect(centerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        enabledFeatures: features,
        allowedDayTypes: dayTypes,
      })
    );
  });

  it("links the admin user to the newly created company", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    vi.mocked(companyRepo.create).mockResolvedValue({
      ...mockCompany,
      id: "new-company-id",
    });
    vi.mocked(userRepo.create).mockResolvedValue({
      ...mockAdmin,
      companyId: "new-company-id",
    });
    vi.mocked(centerRepo.create).mockResolvedValue(mockCenter);

    await useCase.execute(defaultInput);

    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ companyId: "new-company-id" })
    );
  });

  it("is idempotent: returns existing admin without re-creating if profile already exists", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(mockAdmin);

    const result = await useCase.execute(defaultInput);

    expect(companyRepo.create).not.toHaveBeenCalled();
    expect(userRepo.create).not.toHaveBeenCalled();
    expect(centerRepo.create).not.toHaveBeenCalled();
    expect(result).toEqual(mockAdmin);
  });

  it("assigns role admin to the new user", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    vi.mocked(companyRepo.create).mockResolvedValue(mockCompany);
    vi.mocked(userRepo.create).mockResolvedValue(mockAdmin);
    vi.mocked(centerRepo.create).mockResolvedValue(mockCenter);

    await useCase.execute(defaultInput);

    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: "admin" })
    );
  });
});
