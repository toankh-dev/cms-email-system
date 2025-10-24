import {
  Email,
  EmailStatus,
  EmailPriority,
  EmailRecipient,
  EmailAttachment,
} from '../../../domain/models/email.aggregate';
import { EmailSchema } from '../schemas/email.schema';

export class EmailMapper {
  static toDomain(schema: EmailSchema): Email {
    return Email.reconstitute(schema._id.toString(), {
      userId: schema.userId,
      emailAccountId: schema.emailAccountId,
      folderId: schema.folderId,

      messageId: schema.messageId,
      inReplyTo: schema.inReplyTo,
      references: schema.references,
      threadId: schema.threadId,

      from: schema.from as EmailRecipient,
      to: schema.to as EmailRecipient[],
      cc: schema.cc as EmailRecipient[],
      bcc: schema.bcc as EmailRecipient[],
      replyTo: schema.replyTo as EmailRecipient | undefined,

      subject: schema.subject,
      textBody: schema.textBody,
      htmlBody: schema.htmlBody,

      status: schema.status as EmailStatus,
      priority: schema.priority as EmailPriority,
      isRead: schema.isRead,
      isStarred: schema.isStarred,
      isSpam: schema.isSpam,

      attachments: schema.attachments as EmailAttachment[],
      hasAttachments: schema.hasAttachments,

      sentAt: schema.sentAt,
      receivedAt: schema.receivedAt,
      scheduledAt: schema.scheduledAt,
    });
  }

  static toPersistence(email: Email): Partial<EmailSchema> {
    return {
      _id: email.getId() as any,
      userId: email.getUserId(),
      emailAccountId: email.getEmailAccountId(),
      folderId: email.getFolderId(),

      messageId: email.getMessageId(),
      inReplyTo: email.getInReplyTo(),
      references: email.getReferences(),
      threadId: email.getThreadId(),

      from: email.getFrom() as any,
      to: email.getTo() as any,
      cc: email.getCc() as any,
      bcc: email.getBcc() as any,
      replyTo: email.getReplyTo() as any,

      subject: email.getSubject(),
      textBody: email.getTextBody(),
      htmlBody: email.getHtmlBody(),

      status: email.getStatus(),
      priority: email.getPriority(),
      isRead: email.getIsRead(),
      isStarred: email.getIsStarred(),
      isSpam: email.getIsSpam(),

      attachments: email.getAttachments() as any,
      hasAttachments: email.getHasAttachments(),

      sentAt: email.getSentAt(),
      receivedAt: email.getReceivedAt(),
      scheduledAt: email.getScheduledAt(),
    };
  }
}
