import type { InvitationCodeRepository } from "@/core/domain/ports/repositories/invitation-code.repository";
import type { InvitationCode } from "@/core/domain/entities";

interface GenerateInvitationCodeInput {
  companyId: string;
  createdBy: string;
}

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const SEGMENT_LENGTH = 4;

function generateCode(): string {
  const bytes = new Uint8Array(SEGMENT_LENGTH * 2);
  crypto.getRandomValues(bytes);

  const toSegment = (start: number) =>
    Array.from(bytes.slice(start, start + SEGMENT_LENGTH))
      .map((b) => CHARSET[b % CHARSET.length])
      .join("");

  return `JORNIFY-${toSegment(0)}-${toSegment(SEGMENT_LENGTH)}`;
}

export class GenerateInvitationCodeUseCase {
  constructor(private invitationCodeRepo: InvitationCodeRepository) {}

  async execute(input: GenerateInvitationCodeInput): Promise<InvitationCode> {
    const { companyId, createdBy } = input;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.invitationCodeRepo.create({
      companyId,
      code: generateCode(),
      createdBy,
      expiresAt: expiresAt.toISOString(),
    });
  }
}
