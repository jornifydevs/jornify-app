import type { InvitationCode } from "../../entities";

export interface CreateInvitationCodeData {
  companyId: string;
  code: string;
  createdBy: string;
  expiresAt: string;
}

export interface InvitationCodeRepository {
  findByCode(code: string): Promise<InvitationCode | null>;
  findByCompanyId(companyId: string): Promise<InvitationCode[]>;
  create(data: CreateInvitationCodeData): Promise<InvitationCode>;
  consume(code: string, usedBy: string): Promise<void>;
  delete(id: string): Promise<void>;
}
