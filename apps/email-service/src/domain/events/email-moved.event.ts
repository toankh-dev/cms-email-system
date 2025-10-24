import { DomainEvent } from '@app/domain/events/domain-event.base';

export class EmailMovedEvent extends DomainEvent {
  constructor(
    public readonly emailId: string,
    public readonly userId: string,
    public readonly emailAccountId: string,
    public readonly fromFolderId: string,
    public readonly toFolderId: string,
  ) {
    super();
  }
}
