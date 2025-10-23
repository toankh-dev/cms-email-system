import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateFolderCommand } from './update-folder.command';
import { IFolderRepository } from '../../domain/repositories/folder.repository.interface';

@CommandHandler(UpdateFolderCommand)
export class UpdateFolderHandler implements ICommandHandler<UpdateFolderCommand> {
  constructor(
    @Inject('IFolderRepository')
    private readonly repository: IFolderRepository,
  ) {}

  async execute(command: UpdateFolderCommand): Promise<{ success: boolean }> {
    const { folderId, userId, name, icon, color } = command;

    const folder = await this.repository.findById(folderId);
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // Verify ownership
    if (folder.getUserId() !== userId) {
      throw new ForbiddenException('Not authorized to update this folder');
    }

    // Update name if provided
    if (name) {
      folder.rename(name);
    }

    // Update appearance if provided
    if (icon !== undefined || color !== undefined) {
      folder.updateAppearance(icon, color);
    }

    await this.repository.save(folder);

    return { success: true };
  }
}
