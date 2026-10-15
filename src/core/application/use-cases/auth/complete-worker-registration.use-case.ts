import type { UserRepository } from "@/core/domain/ports/repositories/user.repository";
import type { InvitationCodeRepository } from "@/core/domain/ports/repositories/invitation-code.repository";
import type { User } from "@/core/domain/entities";
import { ValidateInvitationCodeUseCase } from "./validate-invitation-code.use-case";

interface CompleteWorkerRegistrationInput {
  userId: string;
  name: string;
  lastName: string;
  email: string;
  phone?: string;
  dni?: string;
  invitationCode: string;
}

export class CompleteWorkerRegistrationUseCase {
  private validator: ValidateInvitationCodeUseCase;

  constructor(
    private userRepo: UserRepository,
    private invitationCodeRepo: InvitationCodeRepository
  ) {
    this.validator = new ValidateInvitationCodeUseCase(invitationCodeRepo);
  }

  async execute(input: CompleteWorkerRegistrationInput): Promise<User> {
    const { userId, name, lastName, email, phone, dni, invitationCode } = input;

    // Idempotency: if user profile already exists, skip creation
    const existing = await this.userRepo.findById(userId);
    if (existing) return existing;

    // Validate code and obtain the company_id it belongs to
    const invitation = await this.validator.execute(invitationCode);

    // Create the user profile
    const user = await this.userRepo.create({
      id: userId,
      name,
      lastName,
      email,
      phone,
      dni,
      role: "worker",
      companyId: invitation.companyId,
    });

    // Consume the invitation code (mark as used by this user)
    await this.invitationCodeRepo.consume(invitationCode, userId);

    return user;
  }
}
