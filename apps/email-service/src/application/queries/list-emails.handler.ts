import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListEmailsQuery } from './list-emails.query';
import {
  IEmailRepository,
  PaginatedResult,
} from '../../domain/repositories/email.repository.interface';
import { Email } from '../../domain/models/email.aggregate';

@QueryHandler(ListEmailsQuery)
export class ListEmailsHandler implements IQueryHandler<ListEmailsQuery> {
  constructor(
    @Inject('IEmailRepository')
    private readonly emailRepository: IEmailRepository,
  ) {}

  async execute(query: ListEmailsQuery): Promise<PaginatedResult<any>> {
    const result = await this.emailRepository.findWithFilters(
      {
        userId: query.userId,
        emailAccountId: query.emailAccountId,
        folderId: query.folderId,
        isRead: query.isRead,
        isStarred: query.isStarred,
        isSpam: query.isSpam,
        searchQuery: query.searchQuery,
      },
      {
        page: query.page,
        limit: query.limit,
      },
    );

    // Map emails to response DTOs
    const items = result.items.map((email: Email) => ({
      id: email.getId(),
      from: email.getFrom(),
      to: email.getTo(),
      subject: email.getSubject(),
      status: email.getStatus(),
      isRead: email.getIsRead(),
      isStarred: email.getIsStarred(),
      isSpam: email.getIsSpam(),
      hasAttachments: email.getHasAttachments(),
      sentAt: email.getSentAt(),
      receivedAt: email.getReceivedAt(),
      folderId: email.getFolderId(),
    }));

    return {
      items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
