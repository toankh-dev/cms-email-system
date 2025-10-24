import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetFolderByIdQuery } from './get-folder-by-id.query';
import { IFolderRepository } from '../../domain/repositories/folder.repository.interface';

@QueryHandler(GetFolderByIdQuery)
export class GetFolderByIdHandler implements IQueryHandler<GetFolderByIdQuery> {
  constructor(
    @Inject('IFolderRepository')
    private readonly repository: IFolderRepository,
  ) {}

  async execute(query: GetFolderByIdQuery): Promise<any> {
    const { folderId, userId } = query;

    const folder = await this.repository.findById(folderId);
    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // Verify ownership
    if (folder.getUserId() !== userId) {
      throw new ForbiddenException('Not authorized to view this folder');
    }

    return {
      id: folder.id,
      name: folder.getName(),
      type: folder.getType(),
      systemFolderName: folder.getSystemFolderName(),
      parentId: folder.getParentId(),
      path: folder.getPath(),
      level: folder.getLevel(),
      order: folder.getOrder(),
      unreadCount: folder.getUnreadCount(),
      totalCount: folder.getTotalCount(),
      icon: folder.getIcon(),
      color: folder.getColor(),
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt,
    };
  }
}
