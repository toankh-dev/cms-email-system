import { DomainEvent } from '@app/domain/events/domain-event.base';

export interface PasswordChangedEventData {
  aggregateId: string;
  email: string;
  changedAt: Date;
}

export class PasswordChangedEvent extends DomainEvent {
  constructor(private readonly data: PasswordChangedEventData) {
    super(data.aggregateId, 'auth.user.password-changed');
  }

  getData(): Record<string, any> {
    return {
      userId: this.data.aggregateId,
      email: this.data.email,
      changedAt: this.data.changedAt.toISOString(),
    };
  }
}
