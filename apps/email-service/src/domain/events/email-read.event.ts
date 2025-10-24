import { DomainEvent } from '@app/domain/events/domain-event.base';

export class EmailReadEvent extends DomainEvent {
  constructor(
    public readonly emailId: string,
    public readonly userId: string,
    public readonly emailAccountId: string,
  ) {
    super();
  }
}
