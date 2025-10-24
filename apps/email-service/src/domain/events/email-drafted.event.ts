import { DomainEvent } from '@app/domain/events/domain-event.base';

export class EmailDraftedEvent extends DomainEvent {
  constructor(
    public readonly emailId: string,
    public readonly userId: string,
    public readonly emailAccountId: string,
    public readonly subject: string,
  ) {
    super(emailId, 'EmailDrafted');
  }

  getData(): Record<string, any> {
    return {
      userId: this.userId,
      emailAccountId: this.emailAccountId,
      subject: this.subject,
    };
  }
}
