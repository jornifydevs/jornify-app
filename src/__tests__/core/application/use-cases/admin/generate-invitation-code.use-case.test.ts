import { describe, it, expect, vi, beforeEach } from "vitest";
import { GenerateInvitationCodeUseCase } from "@/core/application/use-cases/admin/generate-invitation-code.use-case";
import type { InvitationCodeRepository } from "@/core/domain/ports/repositories/invitation-code.repository";
import type { InvitationCode } from "@/core/domain/entities";

const mockCode: InvitationCode = {
  id: "code-id-1",
  companyId: "company-1",
  code: "JORNIFY-ABCD-EFGH",
  status: "pending",
  createdBy: "admin-id-1",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
};

describe("GenerateInvitationCodeUseCase", () => {
  let repo: InvitationCodeRepository;
  let useCase: GenerateInvitationCodeUseCase;

  beforeEach(() => {
    repo = {
      findByCode: vi.fn(),
      findByCompanyId: vi.fn(),
      create: vi.fn(),
      consume: vi.fn(),
    };
    useCase = new GenerateInvitationCodeUseCase(repo);
  });

  it("creates a new invitation code for the company", async () => {
    vi.mocked(repo.create).mockResolvedValue(mockCode);

    const result = await useCase.execute({
      companyId: "company-1",
      createdBy: "admin-id-1",
    });

    expect(repo.create).toHaveBeenCalledOnce();
    expect(result).toEqual(mockCode);
  });

  it("generates a code with the JORNIFY-XXXX-XXXX format", async () => {
    vi.mocked(repo.create).mockResolvedValue(mockCode);

    await useCase.execute({ companyId: "company-1", createdBy: "admin-id-1" });

    const createCall = vi.mocked(repo.create).mock.calls[0][0];
    expect(createCall.code).toMatch(/^JORNIFY-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("sets expiry 7 days from now", async () => {
    vi.mocked(repo.create).mockResolvedValue(mockCode);

    const before = new Date();
    await useCase.execute({ companyId: "company-1", createdBy: "admin-id-1" });
    const after = new Date();

    const createCall = vi.mocked(repo.create).mock.calls[0][0];
    const expiresAt = new Date(createCall.expiresAt);

    const sevenDaysBefore = new Date(before);
    sevenDaysBefore.setDate(sevenDaysBefore.getDate() + 7);

    const sevenDaysAfter = new Date(after);
    sevenDaysAfter.setDate(sevenDaysAfter.getDate() + 7);

    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(
      sevenDaysBefore.getTime() - 1000
    );
    expect(expiresAt.getTime()).toBeLessThanOrEqual(
      sevenDaysAfter.getTime() + 1000
    );
  });

  it("passes the correct companyId and createdBy to the repository", async () => {
    vi.mocked(repo.create).mockResolvedValue(mockCode);

    await useCase.execute({ companyId: "company-42", createdBy: "admin-99" });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-42",
        createdBy: "admin-99",
      })
    );
  });
});
