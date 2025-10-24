import { DomainEvent } from '@app/domain/events/domain-event.base';

export class EmailSentEvent extends DomainEvent {
  constructor(
    public readonly emailId: string,
    public readonly userId: string,
    public readonly emailAccountId: string,
    public readonly recipients: string[],
    public readonly subject: string,
  ) {
    super();
  }
}
