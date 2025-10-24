import { DomainEvent } from '@app/domain/events/domain-event.base';

export interface EmailAccountUpdatedEventData {
  aggregateId: string;
  userId: string;
  updatedAt: Date;
}

export class EmailAccountUpdatedEvent extends DomainEvent {
  constructor(private readonly data: EmailAccountUpdatedEventData) {
    super(data.aggregateId, 'email.account.updated');
  }

  getData(): Record<string, any> {
    return {
      emailAccountId: this.data.aggregateId,
      userId: this.data.userId,
      updatedAt: this.data.updatedAt,
    };
  }
}
