export interface SendEmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface EmailService {
  sendEmail(params: SendEmailParams): Promise<void>;
}
