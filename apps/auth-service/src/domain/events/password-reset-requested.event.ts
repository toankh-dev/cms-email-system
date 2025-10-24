import { DomainEvent } from '@app/domain/events/domain-event.base';

export interface PasswordResetRequestedEventData {
  aggregateId: string;
  email: string;
  passwordResetToken: string;
  requestedAt: Date;
}

export class PasswordResetRequestedEvent extends DomainEvent {
  constructor(private readonly data: PasswordResetRequestedEventData) {
    super(data.aggregateId, 'auth.password-reset.requested');
  }

  getData(): Record<string, any> {
    return {
      userId: this.data.aggregateId,
      email: this.data.email,
      passwordResetToken: this.data.passwordResetToken,
      requestedAt: this.data.requestedAt,
    };
  }
}
