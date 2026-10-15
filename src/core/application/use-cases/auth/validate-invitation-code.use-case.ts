import type { InvitationCodeRepository } from "@/core/domain/ports/repositories/invitation-code.repository";
import type { InvitationCode } from "@/core/domain/entities";
import {
  NotFoundError,
  ValidationError,
} from "@/core/domain/errors/domain-errors";

export class ValidateInvitationCodeUseCase {
  constructor(private invitationCodeRepo: InvitationCodeRepository) {}

  async execute(code: string): Promise<InvitationCode> {
    const invitation = await this.invitationCodeRepo.findByCode(code);

    if (!invitation) {
      throw new NotFoundError("Código de invitación");
    }

    if (invitation.status === "used") {
      throw new ValidationError("El código de invitación ya ha sido utilizado");
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      throw new ValidationError("El código de invitación ha expirado");
    }

    return invitation;
  }
}
