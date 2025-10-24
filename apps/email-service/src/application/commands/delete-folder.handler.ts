import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DeleteFolderCommand } from './delete-folder.command';
import { IFolderRepository } from '../../domain/repositories/folder.repository.interface';

@CommandHandler(DeleteFolderCommand)
export class DeleteFolderHandler implements ICommandHandler<DeleteFolderCommand> {
  constructor(
    @Inject('IFolderRepository')
    private readonly repository: IFolderRepository,
  ) {}

  async execute(command: DeleteFolderCommand): Promise<{ success: boolean }> {
    const { folderId, userId } = command;

    const folder = await this.repository.findById(folderId);
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // Verify ownership
    if (folder.getUserId() !== userId) {
      throw new ForbiddenException('Not authorized to delete this folder');
    }

    // Cannot delete system folders
    if (folder.isSystemFolder()) {
      throw new BadRequestException('Cannot delete system folders');
    }

    // Check if folder has children
    const children = await this.repository.findChildren(folderId);
    if (children.length > 0) {
      throw new BadRequestException('Cannot delete folder with subfolders. Delete subfolders first.');
    }

    // TODO: Check if folder has emails (when Email entity is implemented)
    // For now, just delete the folder

    await this.repository.delete(folderId);

    return { success: true };
  }
}
