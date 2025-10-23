import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DeleteEmailAccountCommand } from './delete-email-account.command';
import { IEmailAccountRepository } from '../../domain/repositories/email-account.repository.interface';

@CommandHandler(DeleteEmailAccountCommand)
export class DeleteEmailAccountHandler implements ICommandHandler<DeleteEmailAccountCommand> {
  constructor(
    @Inject('IEmailAccountRepository')
    private readonly repository: IEmailAccountRepository,
  ) {}

  async execute(command: DeleteEmailAccountCommand): Promise<{ success: boolean }> {
    const { emailAccountId, userId } = command;

    // Find email account
    const account = await this.repository.findById(emailAccountId);
    if (!account) {
      throw new NotFoundException('Email account not found');
    }

    // Verify ownership
    if (account.getUserId() !== userId) {
      throw new ForbiddenException('Not authorized to delete this email account');
    }

    // Delete
    await this.repository.delete(emailAccountId);

    return { success: true };
  }
}
