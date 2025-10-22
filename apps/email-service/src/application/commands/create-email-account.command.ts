import { SmtpConfig, ImapConfig } from '../../domain/models/email-account.aggregate';

export class CreateEmailAccountCommand {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly displayName: string,
    public readonly username: string,
    public readonly password: string,
    public readonly smtpConfig: SmtpConfig,
    public readonly imapConfig: ImapConfig,
  ) {}
}
