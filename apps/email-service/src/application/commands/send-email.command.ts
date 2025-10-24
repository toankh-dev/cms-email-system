import { EmailRecipient, EmailAttachment } from '../../domain/models/email.aggregate';

export class SendEmailCommand {
  constructor(
    public readonly userId: string,
    public readonly emailAccountId: string,
    public readonly from: EmailRecipient,
    public readonly to: EmailRecipient[],
    public readonly subject: string,
    public readonly textBody?: string,
    public readonly htmlBody?: string,
    public readonly cc?: EmailRecipient[],
    public readonly bcc?: EmailRecipient[],
    public readonly attachments?: EmailAttachment[],
    public readonly inReplyTo?: string,
    public readonly references?: string[],
  ) {}
}
