import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SendEmailCommand } from './send-email.command';
import { IEmailRepository } from '../../domain/repositories/email.repository.interface';
import { IFolderRepository } from '../../domain/repositories/folder.repository.interface';
import { IEmailAccountRepository } from '../../domain/repositories/email-account.repository.interface';
import { Email } from '../../domain/models/email.aggregate';
import { SystemFolderName } from '../../domain/models/folder.entity';
import { SmtpService } from '../../infrastructure/mail/smtp.service';

@CommandHandler(SendEmailCommand)
export class SendEmailHandler implements ICommandHandler<SendEmailCommand> {
  constructor(
    @Inject('IEmailRepository')
    private readonly emailRepository: IEmailRepository,
    @Inject('IFolderRepository')
    private readonly folderRepository: IFolderRepository,
    @Inject('IEmailAccountRepository')
    private readonly emailAccountRepository: IEmailAccountRepository,
    private readonly smtpService: SmtpService,
  ) {}

  async execute(command: SendEmailCommand): Promise<{ emailId: string }> {
    // 1. Validate email account exists and belongs to user
    const emailAccount = await this.emailAccountRepository.findById(
      command.emailAccountId,
    );

    if (!emailAccount) {
      throw new NotFoundException('Email account not found');
    }

    if (emailAccount.getUserId() !== command.userId) {
      throw new BadRequestException(
        'Email account does not belong to this user',
      );
    }

    // 2. Find SENT folder
    const sentFolder = await this.folderRepository.findSystemFolder(
      command.emailAccountId,
      SystemFolderName.SENT,
    );

    if (!sentFolder) {
      throw new NotFoundException('SENT folder not found');
    }

    // 3. Create email entity in SENT status
    const emailId = randomUUID();
    const email = Email.createSent(
      emailId,
      command.userId,
      command.emailAccountId,
      sentFolder.getId(),
      command.from,
      command.to,
      command.subject,
      command.textBody,
      command.htmlBody,
      command.cc,
      command.bcc,
      command.attachments,
      undefined, // messageId will be set after SMTP send
      command.inReplyTo,
      command.references,
    );

    // 4. Send via SMTP
    const credentials = emailAccount.getCredentials();
    const smtpConfig = emailAccount.getSmtpConfig();
    const fullSmtpConfig = {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: credentials.getUsername(),
        pass: credentials.getPassword(),
      },
    };

    const result = await this.smtpService.sendEmail(
      command.emailAccountId,
      fullSmtpConfig,
      {
        from: command.from,
        to: command.to,
        cc: command.cc,
        bcc: command.bcc,
        subject: command.subject,
        text: command.textBody,
        html: command.htmlBody,
        attachments: command.attachments,
        inReplyTo: command.inReplyTo,
        references: command.references,
      },
    );

    if (!result.success) {
      email.markAsFailed();
      await this.emailRepository.save(email);
      throw new BadRequestException(`Failed to send email: ${result.error}`);
    }

    // 5. Update email with messageId from SMTP
    // We need to modify Email aggregate to accept messageId
    // For now, save without it

    // 6. Save email to repository
    await this.emailRepository.save(email);

    // 7. Increment SENT folder count
    sentFolder.incrementTotal();
    await this.folderRepository.save(sentFolder);

    return { emailId };
  }
}
