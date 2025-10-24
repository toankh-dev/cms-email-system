import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetFoldersByAccountQuery } from './get-folders-by-account.query';
import { IFolderRepository } from '../../domain/repositories/folder.repository.interface';
import { IEmailAccountRepository } from '../../domain/repositories/email-account.repository.interface';

@QueryHandler(GetFoldersByAccountQuery)
export class GetFoldersByAccountHandler
  implements IQueryHandler<GetFoldersByAccountQuery>
{
  constructor(
    @Inject('IFolderRepository')
    private readonly folderRepository: IFolderRepository,
    @Inject('IEmailAccountRepository')
    private readonly emailAccountRepository: IEmailAccountRepository,
  ) {}

  async execute(query: GetFoldersByAccountQuery): Promise<any[]> {
    const { emailAccountId, userId } = query;

    // Verify email account ownership
    const emailAccount =
      await this.emailAccountRepository.findById(emailAccountId);
    if (!emailAccount || emailAccount.getUserId() !== userId) {
      return [];
    }

    const folders =
      await this.folderRepository.findByEmailAccountId(emailAccountId);

    return folders.map((folder) => ({
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
    }));
  }
}
