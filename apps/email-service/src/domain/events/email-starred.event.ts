import { DomainEvent } from '@app/domain/events/domain-event.base';

export class EmailStarredEvent extends DomainEvent {
  constructor(
    public readonly emailId: string,
    public readonly userId: string,
    public readonly emailAccountId: string,
    public readonly isStarred: boolean,
  ) {
    super();
  }
}
