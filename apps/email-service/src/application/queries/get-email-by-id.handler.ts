import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { GetEmailByIdQuery } from './get-email-by-id.query';
import { IEmailRepository } from '../../domain/repositories/email.repository.interface';

@QueryHandler(GetEmailByIdQuery)
export class GetEmailByIdHandler implements IQueryHandler<GetEmailByIdQuery> {
  constructor(
    @Inject('IEmailRepository')
    private readonly emailRepository: IEmailRepository,
  ) {}

  async execute(query: GetEmailByIdQuery): Promise<any> {
    const email = await this.emailRepository.findById(query.emailId);

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    if (email.getUserId() !== query.userId) {
      throw new BadRequestException('Email does not belong to this user');
    }

    // Return email data
    return {
      id: email.getId(),
      userId: email.getUserId(),
      emailAccountId: email.getEmailAccountId(),
      folderId: email.getFolderId(),
      messageId: email.getMessageId(),
      threadId: email.getThreadId(),
      from: email.getFrom(),
      to: email.getTo(),
      cc: email.getCc(),
      bcc: email.getBcc(),
      replyTo: email.getReplyTo(),
      subject: email.getSubject(),
      textBody: email.getTextBody(),
      htmlBody: email.getHtmlBody(),
      status: email.getStatus(),
      priority: email.getPriority(),
      isRead: email.getIsRead(),
      isStarred: email.getIsStarred(),
      isSpam: email.getIsSpam(),
      attachments: email.getAttachments(),
      hasAttachments: email.getHasAttachments(),
      sentAt: email.getSentAt(),
      receivedAt: email.getReceivedAt(),
      scheduledAt: email.getScheduledAt(),
    };
  }
}
