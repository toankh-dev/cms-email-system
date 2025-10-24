import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateFolderCommand } from './create-folder.command';
import { IFolderRepository } from '../../domain/repositories/folder.repository.interface';
import { Folder } from '../../domain/models/folder.entity';

@CommandHandler(CreateFolderCommand)
export class CreateFolderHandler implements ICommandHandler<CreateFolderCommand> {
  constructor(
    @Inject('IFolderRepository')
    private readonly repository: IFolderRepository,
  ) {}

  async execute(command: CreateFolderCommand): Promise<{
    folderId: string;
    name: string;
  }> {
    const { userId, emailAccountId, name, parentId, icon, color } = command;

    let parentPath = '';
    let parentLevel = -1;

    // If parent is specified, validate it exists
    if (parentId) {
      const parent = await this.repository.findById(parentId);
      if (!parent) {
        throw new NotFoundException('Parent folder not found');
      }

      // Verify ownership
      if (parent.getUserId() !== userId) {
        throw new BadRequestException('Parent folder does not belong to user');
      }

      // Cannot create subfolder under system folders (optional business rule)
      if (parent.isSystemFolder()) {
        throw new BadRequestException('Cannot create subfolders under system folders');
      }

      parentPath = parent.getPath();
      parentLevel = parent.getLevel();
    }

    // Get max order for new folder
    const existingFolders = await this.repository.findByEmailAccountId(emailAccountId);
    const maxOrder = existingFolders.length > 0 ? Math.max(...existingFolders.map(f => f.getOrder())) : -1;

    // Create custom folder
    const folder = Folder.createCustomFolder(
      randomUUID(),
      userId,
      emailAccountId,
      name,
      parentId,
      parentPath,
      parentLevel,
      maxOrder + 1,
      icon,
      color,
    );

    await this.repository.save(folder);

    return {
      folderId: folder.id,
      name: folder.getName(),
    };
  }
}
