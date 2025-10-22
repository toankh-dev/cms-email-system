import { DomainEvent } from '@app/domain/events/domain-event.base';

export interface UserLoggedInEventData {
  aggregateId: string;
  email: string;
  loginAt: Date;
}

export class UserLoggedInEvent extends DomainEvent {
  constructor(private readonly data: UserLoggedInEventData) {
    super(data.aggregateId, 'auth.user.logged-in');
  }

  getData(): Record<string, any> {
    return {
      userId: this.data.aggregateId,
      email: this.data.email,
      loginAt: this.data.loginAt.toISOString(),
    };
  }
}
