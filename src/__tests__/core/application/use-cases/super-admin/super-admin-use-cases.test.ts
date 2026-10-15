import { describe, it, expect, vi, beforeEach } from "vitest";
import { GetAllCompaniesUseCase } from "@/core/application/use-cases/super-admin/get-all-companies.use-case";
import { CreateCompanyUseCase } from "@/core/application/use-cases/super-admin/create-company.use-case";
import { UpdateCompanyUseCase } from "@/core/application/use-cases/super-admin/update-company.use-case";
import { DeleteCompanyUseCase } from "@/core/application/use-cases/super-admin/delete-company.use-case";
import { UpdateCenterFeaturesUseCase } from "@/core/application/use-cases/super-admin/update-center-features.use-case";
import type { CompanyRepository } from "@/core/domain/ports/repositories/company.repository";
import type { CenterRepository } from "@/core/domain/ports/repositories/center.repository";
import type { Company, Center, CenterFeature } from "@/core/domain/entities";
import {
  NotFoundError,
  ValidationError,
} from "@/core/domain/errors/domain-errors";

describe("Super Admin Use Cases", () => {
  let companyRepo: CompanyRepository;
  let centerRepo: CenterRepository;

  const mockCompany: Company = {
    id: "co1",
    nif: "B12345678",
    name: "Empresa Test",
    businessName: "Empresa Test S.L.",
    address: "Calle 123",
    email: "test@empresa.com",
  };

  const mockCenter: Center = {
    id: "c1",
    companyId: "co1",
    name: "Oficina Central",
    address: "Calle 456",
    enabledFeatures: ["profile"] as CenterFeature[],
    allowedDayTypes: ["vacation"],
    defaultStartWorkday: "09:00:00",
    defaultEndWorkday: "18:00:00",
    breakType: "none" as const,
  };

  beforeEach(() => {
    companyRepo = {
      findById: vi.fn(),
      findAll: vi.fn(),
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
  });

  describe("GetAllCompaniesUseCase", () => {
    it("returns all companies", async () => {
      vi.mocked(companyRepo.findAll).mockResolvedValue([mockCompany]);

      const useCase = new GetAllCompaniesUseCase(companyRepo);
      const result = await useCase.execute();

      expect(result).toEqual([mockCompany]);
    });

    it("returns empty array when no companies exist", async () => {
      vi.mocked(companyRepo.findAll).mockResolvedValue([]);

      const useCase = new GetAllCompaniesUseCase(companyRepo);
      const result = await useCase.execute();

      expect(result).toEqual([]);
    });
  });

  describe("CreateCompanyUseCase", () => {
    it("creates a company with valid data", async () => {
      vi.mocked(companyRepo.create).mockResolvedValue(mockCompany);

      const useCase = new CreateCompanyUseCase(companyRepo);
      const result = await useCase.execute({
        nif: "B12345678",
        name: "Empresa Test",
        businessName: "Empresa Test S.L.",
        address: "Calle 123",
        email: "test@empresa.com",
      });

      expect(result).toEqual(mockCompany);
    });

    it("throws ValidationError when required fields are missing", async () => {
      const useCase = new CreateCompanyUseCase(companyRepo);

      await expect(
        useCase.execute({
          nif: "",
          name: "Test",
          businessName: "Test",
          address: "Addr",
          email: "test@test.com",
        })
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("UpdateCompanyUseCase", () => {
    it("updates an existing company", async () => {
      const updated = { ...mockCompany, name: "Nuevo Nombre" };
      vi.mocked(companyRepo.findById).mockResolvedValue(mockCompany);
      vi.mocked(companyRepo.update).mockResolvedValue(updated);

      const useCase = new UpdateCompanyUseCase(companyRepo);
      const result = await useCase.execute("co1", { name: "Nuevo Nombre" });

      expect(result.name).toBe("Nuevo Nombre");
    });

    it("throws NotFoundError when company does not exist", async () => {
      vi.mocked(companyRepo.findById).mockResolvedValue(null);

      const useCase = new UpdateCompanyUseCase(companyRepo);
      await expect(
        useCase.execute("nonexistent", { name: "Test" })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("DeleteCompanyUseCase", () => {
    it("deletes a company with no centers", async () => {
      vi.mocked(companyRepo.findById).mockResolvedValue(mockCompany);
      vi.mocked(centerRepo.findByCompanyId).mockResolvedValue([]);

      const useCase = new DeleteCompanyUseCase(companyRepo, centerRepo);
      await useCase.execute("co1");

      expect(companyRepo.delete).toHaveBeenCalledWith("co1");
    });

    it("throws NotFoundError when company does not exist", async () => {
      vi.mocked(companyRepo.findById).mockResolvedValue(null);

      const useCase = new DeleteCompanyUseCase(companyRepo, centerRepo);
      await expect(useCase.execute("nonexistent")).rejects.toThrow(
        NotFoundError
      );
    });

    it("throws ValidationError when company has centers", async () => {
      vi.mocked(companyRepo.findById).mockResolvedValue(mockCompany);
      vi.mocked(centerRepo.findByCompanyId).mockResolvedValue([mockCenter]);

      const useCase = new DeleteCompanyUseCase(companyRepo, centerRepo);
      await expect(useCase.execute("co1")).rejects.toThrow(ValidationError);
    });
  });

  describe("UpdateCenterFeaturesUseCase", () => {
    it("updates center features", async () => {
      const updated: Center = {
        ...mockCenter,
        enabledFeatures: ["profile", "payroll"] as CenterFeature[],
      };
      vi.mocked(centerRepo.findById).mockResolvedValue(mockCenter);
      vi.mocked(centerRepo.update).mockResolvedValue(updated);

      const useCase = new UpdateCenterFeaturesUseCase(centerRepo);
      const result = await useCase.execute("c1", {
        enabledFeatures: ["profile", "payroll"],
      });

      expect(result.enabledFeatures).toEqual(["profile", "payroll"]);
    });

    it("throws NotFoundError when center does not exist", async () => {
      vi.mocked(centerRepo.findById).mockResolvedValue(null);

      const useCase = new UpdateCenterFeaturesUseCase(centerRepo);
      await expect(
        useCase.execute("nonexistent", { enabledFeatures: [] })
      ).rejects.toThrow(NotFoundError);
    });
  });
});
