import { DomainEvent } from '@app/domain/events/domain-event.base';

export class EmailSentEvent extends DomainEvent {
  constructor(
    public readonly emailId: string,
    public readonly userId: string,
    public readonly emailAccountId: string,
    public readonly recipients: string[],
    public readonly subject: string,
  ) {
    super(emailId, 'EmailSent');
  }

  getData(): Record<string, any> {
    return {
      userId: this.userId,
      emailAccountId: this.emailAccountId,
      recipients: this.recipients,
      subject: this.subject,
    };
  }
}
