import type { InvitationCodeRepository } from "@/core/domain/ports/repositories/invitation-code.repository";

export class DeleteInvitationCodeUseCase {
  constructor(private invitationCodeRepo: InvitationCodeRepository) {}

  async execute(id: string): Promise<void> {
    await this.invitationCodeRepo.delete(id);
  }
}
