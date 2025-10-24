import { DomainEvent } from '@app/domain/events/domain-event.base';

export interface EmailAccountCreatedEventData {
  aggregateId: string;
  userId: string;
  email: string;
  createdAt: Date;
}

export class EmailAccountCreatedEvent extends DomainEvent {
  constructor(private readonly data: EmailAccountCreatedEventData) {
    super(data.aggregateId, 'email.account.created');
  }

  getData(): Record<string, any> {
    return {
      emailAccountId: this.data.aggregateId,
      userId: this.data.userId,
      email: this.data.email,
      createdAt: this.data.createdAt,
    };
  }
}
