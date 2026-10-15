export type InvitationCodeStatus = "pending" | "used";

export interface InvitationCode {
  id: string;
  companyId: string;
  code: string;
  status: InvitationCodeStatus;
  createdBy: string;
  usedBy?: string;
  expiresAt: string;
  createdAt?: string;
}
