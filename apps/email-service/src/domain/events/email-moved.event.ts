import { DomainEvent } from '@app/domain/events/domain-event.base';

export class EmailMovedEvent extends DomainEvent {
  constructor(
    public readonly emailId: string,
    public readonly userId: string,
    public readonly emailAccountId: string,
    public readonly fromFolderId: string,
    public readonly toFolderId: string,
  ) {
    super(emailId, 'EmailMoved');
  }

  getData(): Record<string, any> {
    return {
      userId: this.userId,
      emailAccountId: this.emailAccountId,
      fromFolderId: this.fromFolderId,
      toFolderId: this.toFolderId,
    };
  }
}
