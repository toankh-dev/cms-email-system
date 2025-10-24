import { DomainEvent } from '@app/domain/events/domain-event.base';

export class EmailReceivedEvent extends DomainEvent {
  constructor(
    public readonly emailId: string,
    public readonly userId: string,
    public readonly emailAccountId: string,
    public readonly senderEmail: string,
    public readonly subject: string,
  ) {
    super(emailId, 'EmailReceived');
  }

  getData(): Record<string, any> {
    return {
      userId: this.userId,
      emailAccountId: this.emailAccountId,
      senderEmail: this.senderEmail,
      subject: this.subject,
    };
  }
}
