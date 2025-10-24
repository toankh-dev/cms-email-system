import { DomainEvent } from '@app/domain/events/domain-event.base';

export class EmailStarredEvent extends DomainEvent {
  constructor(
    public readonly emailId: string,
    public readonly userId: string,
    public readonly emailAccountId: string,
    public readonly isStarred: boolean,
  ) {
    super(emailId, 'EmailStarred');
  }

  getData(): Record<string, any> {
    return {
      userId: this.userId,
      emailAccountId: this.emailAccountId,
      isStarred: this.isStarred,
    };
  }
}
