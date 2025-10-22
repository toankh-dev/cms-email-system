import { DomainEvent } from '@app/domain/events/domain-event.base';

export interface UserCreatedEventData {
  aggregateId: string;
  email: string;
  fullName: string;
  role: string;
  emailVerificationToken: string;
}

export class UserCreatedEvent extends DomainEvent {
  constructor(private readonly data: UserCreatedEventData) {
    super(data.aggregateId, 'auth.user.created');
  }

  getData(): Record<string, any> {
    return {
      userId: this.data.aggregateId,
      email: this.data.email,
      fullName: this.data.fullName,
      role: this.data.role,
      emailVerificationToken: this.data.emailVerificationToken,
    };
  }
}
