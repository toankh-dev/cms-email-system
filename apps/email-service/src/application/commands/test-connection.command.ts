export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
}

export interface ImapConfig {
  host: string;
  port: number;
  tls: boolean;
}

export class TestConnectionCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly smtp: SmtpConfig,
    public readonly imap: ImapConfig,
  ) {}
}
