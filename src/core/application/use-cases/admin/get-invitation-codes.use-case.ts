import type { InvitationCodeRepository } from "@/core/domain/ports/repositories/invitation-code.repository";
import type { InvitationCode } from "@/core/domain/entities";

export class GetInvitationCodesUseCase {
  constructor(private invitationCodeRepo: InvitationCodeRepository) {}

  async execute(companyId: string): Promise<InvitationCode[]> {
    return this.invitationCodeRepo.findByCompanyId(companyId);
  }
}
