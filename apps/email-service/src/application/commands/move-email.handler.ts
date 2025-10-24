import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { MoveEmailCommand } from './move-email.command';
import { IEmailRepository } from '../../domain/repositories/email.repository.interface';
import { IFolderRepository } from '../../domain/repositories/folder.repository.interface';

@CommandHandler(MoveEmailCommand)
export class MoveEmailHandler implements ICommandHandler<MoveEmailCommand> {
  constructor(
    @Inject('IEmailRepository')
    private readonly emailRepository: IEmailRepository,
    @Inject('IFolderRepository')
    private readonly folderRepository: IFolderRepository,
  ) {}

  async execute(command: MoveEmailCommand): Promise<void> {
    // 1. Find email
    const email = await this.emailRepository.findById(command.emailId);

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    if (email.getUserId() !== command.userId) {
      throw new BadRequestException('Email does not belong to this user');
    }

    // 2. Validate target folder exists
    const targetFolder = await this.folderRepository.findById(
      command.targetFolderId,
    );

    if (!targetFolder) {
      throw new NotFoundException('Target folder not found');
    }

    if (targetFolder.getUserId() !== command.userId) {
      throw new BadRequestException('Target folder does not belong to this user');
    }

    // 3. Get source folder for count updates
    const sourceFolderId = email.getFolderId();
    const sourceFolder = await this.folderRepository.findById(sourceFolderId);

    // 4. Move email
    email.moveToFolder(command.targetFolderId);
    await this.emailRepository.save(email);

    // 5. Update folder counts
    if (sourceFolder) {
      sourceFolder.decrementTotal();
      if (!email.getIsRead()) {
        sourceFolder.decrementUnread();
      }
      await this.folderRepository.save(sourceFolder);
    }

    targetFolder.incrementTotal();
    if (!email.getIsRead()) {
      targetFolder.incrementUnread();
    }
    await this.folderRepository.save(targetFolder);
  }
}
