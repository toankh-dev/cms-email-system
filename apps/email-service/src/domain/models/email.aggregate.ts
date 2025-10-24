import { AggregateRoot } from '@app/domain/base/aggregate-root.base';
import { EmailSentEvent } from '../events/email-sent.event';
import { EmailReceivedEvent } from '../events/email-received.event';
import { EmailDraftedEvent } from '../events/email-drafted.event';
import { EmailReadEvent } from '../events/email-read.event';
import { EmailStarredEvent } from '../events/email-starred.event';
import { EmailMovedEvent } from '../events/email-moved.event';

export enum EmailStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  RECEIVED = 'RECEIVED',
  FAILED = 'FAILED',
}

export enum EmailPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
}

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  path?: string; // S3 path or local path
  cid?: string; // Content-ID for inline images
}

export interface EmailProps {
  userId: string;
  emailAccountId: string;
  folderId: string;

  // Email headers
  messageId?: string; // IMAP/SMTP message ID
  inReplyTo?: string; // For threading
  references?: string[]; // For threading
  threadId?: string; // Conversation thread

  // Sender and recipients
  from: EmailRecipient;
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  replyTo?: EmailRecipient;

  // Content
  subject: string;
  textBody?: string;
  htmlBody?: string;

  // Metadata
  status: EmailStatus;
  priority: EmailPriority;
  isRead: boolean;
  isStarred: boolean;
  isSpam: boolean;

  // Attachments
  attachments?: EmailAttachment[];
  hasAttachments: boolean;

  // Timestamps
  sentAt?: Date;
  receivedAt?: Date;
  scheduledAt?: Date; // For scheduled emails
}

export class Email extends AggregateRoot<string> {
  private userId: string;
  private emailAccountId: string;
  private folderId: string;

  private messageId?: string;
  private inReplyTo?: string;
  private references: string[];
  private threadId?: string;

  private from: EmailRecipient;
  private to: EmailRecipient[];
  private cc: EmailRecipient[];
  private bcc: EmailRecipient[];
  private replyTo?: EmailRecipient;

  private subject: string;
  private textBody?: string;
  private htmlBody?: string;

  private status: EmailStatus;
  private priority: EmailPriority;
  private isRead: boolean;
  private isStarred: boolean;
  private isSpam: boolean;

  private attachments: EmailAttachment[];
  private hasAttachments: boolean;

  private sentAt?: Date;
  private receivedAt?: Date;
  private scheduledAt?: Date;

  private constructor(id: string, props: EmailProps) {
    super(id);
    this.userId = props.userId;
    this.emailAccountId = props.emailAccountId;
    this.folderId = props.folderId;

    this.messageId = props.messageId;
    this.inReplyTo = props.inReplyTo;
    this.references = props.references || [];
    this.threadId = props.threadId;

    this.from = props.from;
    this.to = props.to;
    this.cc = props.cc || [];
    this.bcc = props.bcc || [];
    this.replyTo = props.replyTo;

    this.subject = props.subject;
    this.textBody = props.textBody;
    this.htmlBody = props.htmlBody;

    this.status = props.status;
    this.priority = props.priority;
    this.isRead = props.isRead;
    this.isStarred = props.isStarred;
    this.isSpam = props.isSpam;

    this.attachments = props.attachments || [];
    this.hasAttachments = props.hasAttachments;

    this.sentAt = props.sentAt;
    this.receivedAt = props.receivedAt;
    this.scheduledAt = props.scheduledAt;
  }

  // Factory method: Create draft email
  static createDraft(
    id: string,
    userId: string,
    emailAccountId: string,
    folderId: string,
    from: EmailRecipient,
    to: EmailRecipient[],
    subject: string,
    textBody?: string,
    htmlBody?: string,
    cc?: EmailRecipient[],
    bcc?: EmailRecipient[],
    attachments?: EmailAttachment[],
  ): Email {
    const email = new Email(id, {
      userId,
      emailAccountId,
      folderId,
      from,
      to,
      cc,
      bcc,
      subject,
      textBody,
      htmlBody,
      status: EmailStatus.DRAFT,
      priority: EmailPriority.NORMAL,
      isRead: true, // Drafts are always "read" by creator
      isStarred: false,
      isSpam: false,
      attachments,
      hasAttachments: (attachments?.length || 0) > 0,
    });

    email.addDomainEvent(
      new EmailDraftedEvent(id, userId, emailAccountId, subject),
    );

    return email;
  }

  // Factory method: Create sent email
  static createSent(
    id: string,
    userId: string,
    emailAccountId: string,
    folderId: string,
    from: EmailRecipient,
    to: EmailRecipient[],
    subject: string,
    textBody?: string,
    htmlBody?: string,
    cc?: EmailRecipient[],
    bcc?: EmailRecipient[],
    attachments?: EmailAttachment[],
    messageId?: string,
    inReplyTo?: string,
    references?: string[],
  ): Email {
    const email = new Email(id, {
      userId,
      emailAccountId,
      folderId,
      from,
      to,
      cc,
      bcc,
      subject,
      textBody,
      htmlBody,
      messageId,
      inReplyTo,
      references,
      status: EmailStatus.SENT,
      priority: EmailPriority.NORMAL,
      isRead: true,
      isStarred: false,
      isSpam: false,
      attachments,
      hasAttachments: (attachments?.length || 0) > 0,
      sentAt: new Date(),
    });

    email.addDomainEvent(
      new EmailSentEvent(id, userId, emailAccountId, to.map((r) => r.email), subject),
    );

    return email;
  }

  // Factory method: Create received email
  static createReceived(
    id: string,
    userId: string,
    emailAccountId: string,
    folderId: string,
    from: EmailRecipient,
    to: EmailRecipient[],
    subject: string,
    textBody?: string,
    htmlBody?: string,
    cc?: EmailRecipient[],
    messageId?: string,
    inReplyTo?: string,
    references?: string[],
    attachments?: EmailAttachment[],
    receivedAt?: Date,
  ): Email {
    const email = new Email(id, {
      userId,
      emailAccountId,
      folderId,
      from,
      to,
      cc,
      subject,
      textBody,
      htmlBody,
      messageId,
      inReplyTo,
      references,
      status: EmailStatus.RECEIVED,
      priority: EmailPriority.NORMAL,
      isRead: false,
      isStarred: false,
      isSpam: false,
      attachments,
      hasAttachments: (attachments?.length || 0) > 0,
      receivedAt: receivedAt || new Date(),
    });

    email.addDomainEvent(
      new EmailReceivedEvent(id, userId, emailAccountId, from.email, subject),
    );

    return email;
  }

  // Factory method: Reconstitute from persistence
  static reconstitute(id: string, props: EmailProps): Email {
    return new Email(id, props);
  }

  // Business methods
  markAsRead(): void {
    if (!this.isRead) {
      this.isRead = true;
      this.addDomainEvent(new EmailReadEvent(this.id, this.userId, this.emailAccountId));
    }
  }

  markAsUnread(): void {
    this.isRead = false;
  }

  toggleStar(): void {
    this.isStarred = !this.isStarred;
    if (this.isStarred) {
      this.addDomainEvent(new EmailStarredEvent(this.id, this.userId, this.emailAccountId, true));
    }
  }

  markAsSpam(): void {
    this.isSpam = true;
  }

  markAsNotSpam(): void {
    this.isSpam = false;
  }

  moveToFolder(newFolderId: string): void {
    if (this.folderId !== newFolderId) {
      const oldFolderId = this.folderId;
      this.folderId = newFolderId;
      this.addDomainEvent(
        new EmailMovedEvent(this.id, this.userId, this.emailAccountId, oldFolderId, newFolderId),
      );
    }
  }

  updateDraft(
    subject?: string,
    textBody?: string,
    htmlBody?: string,
    to?: EmailRecipient[],
    cc?: EmailRecipient[],
    bcc?: EmailRecipient[],
    attachments?: EmailAttachment[],
  ): void {
    if (this.status !== EmailStatus.DRAFT) {
      throw new Error('Cannot update email that is not a draft');
    }

    if (subject !== undefined) this.subject = subject;
    if (textBody !== undefined) this.textBody = textBody;
    if (htmlBody !== undefined) this.htmlBody = htmlBody;
    if (to !== undefined) this.to = to;
    if (cc !== undefined) this.cc = cc;
    if (bcc !== undefined) this.bcc = bcc;
    if (attachments !== undefined) {
      this.attachments = attachments;
      this.hasAttachments = attachments.length > 0;
    }
  }

  send(messageId: string): void {
    if (this.status !== EmailStatus.DRAFT) {
      throw new Error('Can only send draft emails');
    }

    this.status = EmailStatus.SENT;
    this.messageId = messageId;
    this.sentAt = new Date();

    this.addDomainEvent(
      new EmailSentEvent(
        this.id,
        this.userId,
        this.emailAccountId,
        this.to.map((r) => r.email),
        this.subject,
      ),
    );
  }

  markAsFailed(): void {
    this.status = EmailStatus.FAILED;
  }

  setThreadId(threadId: string): void {
    this.threadId = threadId;
  }

  setPriority(priority: EmailPriority): void {
    this.priority = priority;
  }

  scheduleFor(scheduledAt: Date): void {
    if (this.status !== EmailStatus.DRAFT) {
      throw new Error('Can only schedule draft emails');
    }
    this.scheduledAt = scheduledAt;
  }

  // Getters
  getUserId(): string {
    return this.userId;
  }

  getEmailAccountId(): string {
    return this.emailAccountId;
  }

  getFolderId(): string {
    return this.folderId;
  }

  getMessageId(): string | undefined {
    return this.messageId;
  }

  getInReplyTo(): string | undefined {
    return this.inReplyTo;
  }

  getReferences(): string[] {
    return this.references;
  }

  getThreadId(): string | undefined {
    return this.threadId;
  }

  getFrom(): EmailRecipient {
    return this.from;
  }

  getTo(): EmailRecipient[] {
    return this.to;
  }

  getCc(): EmailRecipient[] {
    return this.cc;
  }

  getBcc(): EmailRecipient[] {
    return this.bcc;
  }

  getReplyTo(): EmailRecipient | undefined {
    return this.replyTo;
  }

  getSubject(): string {
    return this.subject;
  }

  getTextBody(): string | undefined {
    return this.textBody;
  }

  getHtmlBody(): string | undefined {
    return this.htmlBody;
  }

  getStatus(): EmailStatus {
    return this.status;
  }

  getPriority(): EmailPriority {
    return this.priority;
  }

  getIsRead(): boolean {
    return this.isRead;
  }

  getIsStarred(): boolean {
    return this.isStarred;
  }

  getIsSpam(): boolean {
    return this.isSpam;
  }

  getAttachments(): EmailAttachment[] {
    return this.attachments;
  }

  getHasAttachments(): boolean {
    return this.hasAttachments;
  }

  getSentAt(): Date | undefined {
    return this.sentAt;
  }

  getReceivedAt(): Date | undefined {
    return this.receivedAt;
  }

  getScheduledAt(): Date | undefined {
    return this.scheduledAt;
  }
}
