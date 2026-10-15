import type { InvitationCodeRepository } from "@/core/domain/ports/repositories/invitation-code.repository";
import { ValidateInvitationCodeUseCase } from "./validate-invitation-code.use-case";

export class ConsumeInvitationCodeUseCase {
  private validator: ValidateInvitationCodeUseCase;

  constructor(private invitationCodeRepo: InvitationCodeRepository) {
    this.validator = new ValidateInvitationCodeUseCase(invitationCodeRepo);
  }

  async execute(code: string, userId: string): Promise<void> {
    await this.validator.execute(code);
    await this.invitationCodeRepo.consume(code, userId);
  }
}
