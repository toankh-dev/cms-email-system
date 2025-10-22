import { SmtpConfig, ImapConfig } from '../../domain/models/email-account.aggregate';

export class UpdateEmailAccountCommand {
  constructor(
    public readonly emailAccountId: string,
    public readonly userId: string,
    public readonly displayName: string,
    public readonly smtpConfig: SmtpConfig,
    public readonly imapConfig: ImapConfig,
  ) {}
}
