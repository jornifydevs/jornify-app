import { describe, it, expect, vi, beforeEach } from "vitest";
import { ValidateInvitationCodeUseCase } from "@/core/application/use-cases/auth/validate-invitation-code.use-case";
import type { InvitationCodeRepository } from "@/core/domain/ports/repositories/invitation-code.repository";
import type { InvitationCode } from "@/core/domain/entities";
import {
  NotFoundError,
  ValidationError,
} from "@/core/domain/errors/domain-errors";

const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const pastDate = new Date(Date.now() - 1000).toISOString();

const validCode: InvitationCode = {
  id: "code-id-1",
  companyId: "company-1",
  code: "JORNIFY-ABCD-EFGH",
  status: "pending",
  createdBy: "admin-id-1",
  expiresAt: futureDate,
  createdAt: new Date().toISOString(),
};

describe("ValidateInvitationCodeUseCase", () => {
  let repo: InvitationCodeRepository;
  let useCase: ValidateInvitationCodeUseCase;

  beforeEach(() => {
    repo = {
      findByCode: vi.fn(),
      findByCompanyId: vi.fn(),
      create: vi.fn(),
      consume: vi.fn(),
    };
    useCase = new ValidateInvitationCodeUseCase(repo);
  });

  it("returns the invitation code when valid", async () => {
    vi.mocked(repo.findByCode).mockResolvedValue(validCode);

    const result = await useCase.execute("JORNIFY-ABCD-EFGH");

    expect(result).toEqual(validCode);
  });

  it("throws NotFoundError when code does not exist", async () => {
    vi.mocked(repo.findByCode).mockResolvedValue(null);

    await expect(useCase.execute("INVALID-CODE")).rejects.toThrow(
      NotFoundError
    );
  });

  it("throws ValidationError when code is already used", async () => {
    vi.mocked(repo.findByCode).mockResolvedValue({
      ...validCode,
      status: "used",
      usedBy: "some-user",
    });

    await expect(useCase.execute("JORNIFY-ABCD-EFGH")).rejects.toThrow(
      ValidationError
    );
  });

  it("throws ValidationError with 'utilizado' message when code is used", async () => {
    vi.mocked(repo.findByCode).mockResolvedValue({
      ...validCode,
      status: "used",
    });

    await expect(useCase.execute("JORNIFY-ABCD-EFGH")).rejects.toThrow(
      "El código de invitación ya ha sido utilizado"
    );
  });

  it("throws ValidationError when code is expired", async () => {
    vi.mocked(repo.findByCode).mockResolvedValue({
      ...validCode,
      expiresAt: pastDate,
    });

    await expect(useCase.execute("JORNIFY-ABCD-EFGH")).rejects.toThrow(
      ValidationError
    );
  });

  it("throws ValidationError with 'expirado' message when code is expired", async () => {
    vi.mocked(repo.findByCode).mockResolvedValue({
      ...validCode,
      expiresAt: pastDate,
    });

    await expect(useCase.execute("JORNIFY-ABCD-EFGH")).rejects.toThrow(
      "El código de invitación ha expirado"
    );
  });

  it("calls findByCode with the provided code", async () => {
    vi.mocked(repo.findByCode).mockResolvedValue(validCode);

    await useCase.execute("JORNIFY-TEST-1234");

    expect(repo.findByCode).toHaveBeenCalledWith("JORNIFY-TEST-1234");
  });
});
