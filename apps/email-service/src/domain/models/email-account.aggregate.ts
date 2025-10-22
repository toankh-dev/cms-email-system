import { AggregateRoot } from '@app/domain/base/aggregate-root.base';
import { Email } from '@app/domain/value-objects/email.vo';
import { EmailCredentials } from '../value-objects/email-credentials.vo';
import { EmailAccountCreatedEvent } from '../events/email-account-created.event';
import { EmailAccountUpdatedEvent } from '../events/email-account-updated.event';

export enum EmailAccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ERROR = 'ERROR',
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean; // true for 465, false for other ports
}

export interface ImapConfig {
  host: string;
  port: number;
  tls: boolean;
}

export interface EmailAccountProps {
  userId: string;
  email: Email;
  displayName: string;
  credentials: EmailCredentials;
  smtpConfig: SmtpConfig;
  imapConfig: ImapConfig;
  status: EmailAccountStatus;
  lastSyncAt?: Date;
  errorMessage?: string;
}

/**
 * EmailAccount Aggregate Root
 * Represents a user's email account configuration for sending/receiving emails
 */
export class EmailAccount extends AggregateRoot<string> {
  private userId: string;
  private email: Email;
  private displayName: string;
  private credentials: EmailCredentials;
  private smtpConfig: SmtpConfig;
  private imapConfig: ImapConfig;
  private status: EmailAccountStatus;
  private lastSyncAt?: Date;
  private errorMessage?: string;

  private constructor(id: string, props: EmailAccountProps) {
    super(id);
    this.userId = props.userId;
    this.email = props.email;
    this.displayName = props.displayName;
    this.credentials = props.credentials;
    this.smtpConfig = props.smtpConfig;
    this.imapConfig = props.imapConfig;
    this.status = props.status;
    this.lastSyncAt = props.lastSyncAt;
    this.errorMessage = props.errorMessage;
  }

  /**
   * Factory method to create a new email account
   */
  static create(
    id: string,
    userId: string,
    email: string,
    displayName: string,
    username: string,
    password: string,
    smtpConfig: SmtpConfig,
    imapConfig: ImapConfig,
  ): EmailAccount {
    const emailVo = Email.create(email);
    const credentials = EmailCredentials.create(username, password);

    const props: EmailAccountProps = {
      userId,
      email: emailVo,
      displayName,
      credentials,
      smtpConfig,
      imapConfig,
      status: EmailAccountStatus.INACTIVE, // Start as inactive until tested
    };

    const account = new EmailAccount(id, props);

    // Publish domain event
    account.addDomainEvent(
      new EmailAccountCreatedEvent({
        aggregateId: id,
        userId,
        email: emailVo.getValue(),
        createdAt: new Date(),
      }),
    );

    return account;
  }

  /**
   * Factory method to reconstitute from persistence
   */
  static reconstitute(id: string, props: EmailAccountProps): EmailAccount {
    return new EmailAccount(id, props);
  }

  /**
   * Test connection and activate account
   */
  async activate(): Promise<void> {
    this.status = EmailAccountStatus.ACTIVE;
    this.errorMessage = undefined;
    this.touch();
  }

  /**
   * Mark account as having error
   */
  markAsError(errorMessage: string): void {
    this.status = EmailAccountStatus.ERROR;
    this.errorMessage = errorMessage;
    this.touch();
  }

  /**
   * Update account configuration
   */
  updateConfig(
    displayName: string,
    smtpConfig: SmtpConfig,
    imapConfig: ImapConfig,
  ): void {
    this.displayName = displayName;
    this.smtpConfig = smtpConfig;
    this.imapConfig = imapConfig;
    this.touch();

    // Publish domain event
    this.addDomainEvent(
      new EmailAccountUpdatedEvent({
        aggregateId: this._id,
        userId: this.userId,
        updatedAt: new Date(),
      }),
    );
  }

  /**
   * Update credentials
   */
  updateCredentials(username: string, password: string): void {
    this.credentials = EmailCredentials.create(username, password);
    this.status = EmailAccountStatus.INACTIVE; // Require reactivation
    this.touch();
  }

  /**
   * Update last sync timestamp
   */
  updateLastSync(): void {
    this.lastSyncAt = new Date();
    this.touch();
  }

  /**
   * Deactivate account
   */
  deactivate(): void {
    this.status = EmailAccountStatus.INACTIVE;
    this.touch();
  }

  // Getters
  getUserId(): string {
    return this.userId;
  }

  getEmail(): Email {
    return this.email;
  }

  getDisplayName(): string {
    return this.displayName;
  }

  getCredentials(): EmailCredentials {
    return this.credentials;
  }

  getSmtpConfig(): SmtpConfig {
    return this.smtpConfig;
  }

  getImapConfig(): ImapConfig {
    return this.imapConfig;
  }

  getStatus(): EmailAccountStatus {
    return this.status;
  }

  getLastSyncAt(): Date | undefined {
    return this.lastSyncAt;
  }

  getErrorMessage(): string | undefined {
    return this.errorMessage;
  }

  isActive(): boolean {
    return this.status === EmailAccountStatus.ACTIVE;
  }
}
