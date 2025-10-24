import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TestConnectionCommand } from './test-connection.command';
import { SmtpService } from '../../infrastructure/mail/smtp.service';
import { ImapService } from '../../infrastructure/mail/imap.service';

@CommandHandler(TestConnectionCommand)
export class TestConnectionHandler
  implements ICommandHandler<TestConnectionCommand>
{
  constructor(
    private readonly smtpService: SmtpService,
    private readonly imapService: ImapService,
  ) {}

  async execute(
    command: TestConnectionCommand,
  ): Promise<{ smtp: boolean; imap: boolean; message: string }> {
    // Test SMTP
    const smtpConfig = {
      host: command.smtp.host,
      port: command.smtp.port,
      secure: command.smtp.secure,
      auth: {
        user: command.email,
        pass: command.password,
      },
    };

    const smtpSuccess = await this.smtpService.testConnection(smtpConfig);

    // Test IMAP
    const imapConfig = {
      host: command.imap.host,
      port: command.imap.port,
      user: command.email,
      password: command.password,
      tls: command.imap.tls,
    };

    const imapSuccess = await this.imapService.testConnection(imapConfig);

    // Build response message
    let message = '';
    if (smtpSuccess && imapSuccess) {
      message = 'Both SMTP and IMAP connections successful';
    } else if (smtpSuccess && !imapSuccess) {
      message = 'SMTP connected, but IMAP failed';
    } else if (!smtpSuccess && imapSuccess) {
      message = 'IMAP connected, but SMTP failed';
    } else {
      message = 'Both SMTP and IMAP connections failed';
    }

    return {
      smtp: smtpSuccess,
      imap: imapSuccess,
      message,
    };
  }
}
