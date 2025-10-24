import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateEmailAccountCommand } from './update-email-account.command';
import { IEmailAccountRepository } from '../../domain/repositories/email-account.repository.interface';

@CommandHandler(UpdateEmailAccountCommand)
export class UpdateEmailAccountHandler implements ICommandHandler<UpdateEmailAccountCommand> {
  constructor(
    @Inject('IEmailAccountRepository')
    private readonly repository: IEmailAccountRepository,
  ) {}

  async execute(command: UpdateEmailAccountCommand): Promise<{ success: boolean }> {
    const { emailAccountId, userId, displayName, smtpConfig, imapConfig } = command;

    // Find email account
    const account = await this.repository.findById(emailAccountId);
    if (!account) {
      throw new NotFoundException('Email account not found');
    }

    // Verify ownership
    if (account.getUserId() !== userId) {
      throw new ForbiddenException('Not authorized to update this email account');
    }

    // Update configuration
    account.updateConfig(displayName, smtpConfig, imapConfig);

    // Save
    await this.repository.save(account);

    return { success: true };
  }
}
