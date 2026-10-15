import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompleteWorkerRegistrationUseCase } from "@/core/application/use-cases/auth/complete-worker-registration.use-case";
import type { UserRepository } from "@/core/domain/ports/repositories/user.repository";
import type { InvitationCodeRepository } from "@/core/domain/ports/repositories/invitation-code.repository";
import type { User, InvitationCode } from "@/core/domain/entities";
import {
  NotFoundError,
  ValidationError,
} from "@/core/domain/errors/domain-errors";

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const mockInvitation: InvitationCode = {
  id: "inv-1",
  companyId: "company-1",
  code: "JORNIFY-ABCD-EFGH",
  status: "pending",
  createdBy: "admin-1",
  expiresAt: futureDate,
};

const mockUser: User = {
  id: "user-1",
  name: "Juan",
  lastName: "García",
  email: "juan@example.com",
  phone: "612345678",
  role: "worker",
  companyId: "company-1",
};

describe("CompleteWorkerRegistrationUseCase", () => {
  let userRepo: UserRepository;
  let invitationCodeRepo: InvitationCodeRepository;
  let useCase: CompleteWorkerRegistrationUseCase;

  beforeEach(() => {
    userRepo = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      findByIds: vi.fn(),
      findWorkersByCompanyId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    };
    invitationCodeRepo = {
      findByCode: vi.fn(),
      findByCompanyId: vi.fn(),
      create: vi.fn(),
      consume: vi.fn(),
    };
    useCase = new CompleteWorkerRegistrationUseCase(
      userRepo,
      invitationCodeRepo
    );
  });

  it("creates a worker user profile with the company from the invitation", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    vi.mocked(invitationCodeRepo.findByCode).mockResolvedValue(mockInvitation);
    vi.mocked(userRepo.create).mockResolvedValue(mockUser);
    vi.mocked(invitationCodeRepo.consume).mockResolvedValue(undefined);

    const result = await useCase.execute({
      userId: "user-1",
      name: "Juan",
      lastName: "García",
      email: "juan@example.com",
      phone: "612345678",
      invitationCode: "JORNIFY-ABCD-EFGH",
    });

    expect(userRepo.create).toHaveBeenCalledWith({
      id: "user-1",
      name: "Juan",
      lastName: "García",
      email: "juan@example.com",
      phone: "612345678",
      role: "worker",
      companyId: "company-1",
    });
    expect(invitationCodeRepo.consume).toHaveBeenCalledWith(
      "JORNIFY-ABCD-EFGH",
      "user-1"
    );
    expect(result).toEqual(mockUser);
  });

  it("is idempotent: returns existing user without re-creating if profile already exists", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(mockUser);

    const result = await useCase.execute({
      userId: "user-1",
      name: "Juan",
      lastName: "García",
      email: "juan@example.com",
      invitationCode: "JORNIFY-ABCD-EFGH",
    });

    expect(userRepo.create).not.toHaveBeenCalled();
    expect(invitationCodeRepo.consume).not.toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  it("throws NotFoundError when invitation code does not exist", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    vi.mocked(invitationCodeRepo.findByCode).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: "user-1",
        name: "Juan",
        lastName: "García",
        email: "juan@example.com",
        invitationCode: "INVALID-CODE",
      })
    ).rejects.toThrow(NotFoundError);
  });

  it("throws ValidationError when invitation code is already used", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    vi.mocked(invitationCodeRepo.findByCode).mockResolvedValue({
      ...mockInvitation,
      status: "used",
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        name: "Juan",
        lastName: "García",
        email: "juan@example.com",
        invitationCode: "JORNIFY-ABCD-EFGH",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("throws ValidationError when invitation code is expired", async () => {
    vi.mocked(userRepo.findById).mockResolvedValue(null);
    vi.mocked(invitationCodeRepo.findByCode).mockResolvedValue({
      ...mockInvitation,
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });

    await expect(
      useCase.execute({
        userId: "user-1",
        name: "Juan",
        lastName: "García",
        email: "juan@example.com",
        invitationCode: "JORNIFY-ABCD-EFGH",
      })
    ).rejects.toThrow(ValidationError);
  });
});
