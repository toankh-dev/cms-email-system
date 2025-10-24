import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SaveDraftCommand } from './save-draft.command';
import { IEmailRepository } from '../../domain/repositories/email.repository.interface';
import { IFolderRepository } from '../../domain/repositories/folder.repository.interface';
import { IEmailAccountRepository } from '../../domain/repositories/email-account.repository.interface';
import { Email } from '../../domain/models/email.aggregate';
import { SystemFolderName } from '../../domain/models/folder.entity';

@CommandHandler(SaveDraftCommand)
export class SaveDraftHandler implements ICommandHandler<SaveDraftCommand> {
  constructor(
    @Inject('IEmailRepository')
    private readonly emailRepository: IEmailRepository,
    @Inject('IFolderRepository')
    private readonly folderRepository: IFolderRepository,
    @Inject('IEmailAccountRepository')
    private readonly emailAccountRepository: IEmailAccountRepository,
  ) {}

  async execute(command: SaveDraftCommand): Promise<{ emailId: string }> {
    // 1. Validate email account
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

    // 2. Find DRAFTS folder
    const draftsFolder = await this.folderRepository.findSystemFolder(
      command.emailAccountId,
      SystemFolderName.DRAFTS,
    );

    if (!draftsFolder) {
      throw new NotFoundException('DRAFTS folder not found');
    }

    // 3. Create draft email
    const emailId = randomUUID();
    const email = Email.createDraft(
      emailId,
      command.userId,
      command.emailAccountId,
      draftsFolder.getId(),
      command.from,
      command.to,
      command.subject,
      command.textBody,
      command.htmlBody,
      command.cc,
      command.bcc,
      command.attachments,
    );

    // 4. Save email
    await this.emailRepository.save(email);

    // 5. Increment DRAFTS folder count
    draftsFolder.incrementTotal();
    await this.folderRepository.save(draftsFolder);

    return { emailId };
  }
}
