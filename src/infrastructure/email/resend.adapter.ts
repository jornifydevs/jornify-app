import { Resend } from "resend";
import type {
  EmailService,
  SendEmailParams,
} from "@/core/domain/ports/services/email.service";
import { config } from "@/config";

let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export class ResendAdapter implements EmailService {
  async sendEmail({ to, subject, text, html }: SendEmailParams): Promise<void> {
    const { error } = await getResendClient().emails.send({
      from: config.email.from,
      to,
      subject,
      ...(html ? { html } : { text: text ?? "" }),
    } as Parameters<Resend["emails"]["send"]>[0]);

    if (error) {
      throw new Error(`Resend error: ${error.message}`);
    }
  }
}
