import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InitializeFoldersCommand } from './initialize-folders.command';
import { IFolderRepository } from '../../domain/repositories/folder.repository.interface';
import { Folder, SystemFolderName } from '../../domain/models/folder.entity';

@CommandHandler(InitializeFoldersCommand)
export class InitializeFoldersHandler implements ICommandHandler<InitializeFoldersCommand> {
  constructor(
    @Inject('IFolderRepository')
    private readonly repository: IFolderRepository,
  ) {}

  async execute(command: InitializeFoldersCommand): Promise<{
    foldersCreated: number;
  }> {
    const { userId, emailAccountId } = command;

    // Define system folders with their order
    const systemFolders = [
      { name: SystemFolderName.INBOX, order: 0 },
      { name: SystemFolderName.SENT, order: 1 },
      { name: SystemFolderName.DRAFTS, order: 2 },
      { name: SystemFolderName.TRASH, order: 3 },
      { name: SystemFolderName.SPAM, order: 4 },
      { name: SystemFolderName.ARCHIVE, order: 5 },
    ];

    let created = 0;

    for (const { name, order } of systemFolders) {
      // Check if folder already exists
      const existing = await this.repository.findSystemFolder(emailAccountId, name);

      if (!existing) {
        const folder = Folder.createSystemFolder(randomUUID(), userId, emailAccountId, name, order);

        await this.repository.save(folder);
        created++;
      }
    }

    return { foldersCreated: created };
  }
}
