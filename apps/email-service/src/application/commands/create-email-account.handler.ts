import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateEmailAccountCommand } from './create-email-account.command';
import { IEmailAccountRepository } from '../../domain/repositories/email-account.repository.interface';
import { EmailAccount } from '../../domain/models/email-account.aggregate';

@CommandHandler(CreateEmailAccountCommand)
export class CreateEmailAccountHandler implements ICommandHandler<CreateEmailAccountCommand> {
  constructor(
    @Inject('IEmailAccountRepository')
    private readonly repository: IEmailAccountRepository,
  ) {}

  async execute(command: CreateEmailAccountCommand): Promise<{
    emailAccountId: string;
    email: string;
  }> {
    const { userId, email, displayName, username, password, smtpConfig, imapConfig } = command;

    // Check if email account already exists for this user
    const existing = await this.repository.findByEmail(userId, email);
    if (existing) {
      throw new ConflictException('Email account already exists for this user');
    }

    // Create new email account aggregate
    const account = EmailAccount.create(randomUUID(), userId, email, displayName, username, password, smtpConfig, imapConfig);

    // Save to repository
    await this.repository.save(account);

    return {
      emailAccountId: account.id,
      email: account.getEmail().getValue(),
    };
  }
}
