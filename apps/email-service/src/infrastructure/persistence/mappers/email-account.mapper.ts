import { Email } from '@app/domain/value-objects/email.vo';
import { EmailAccount, EmailAccountStatus } from '../../../domain/models/email-account.aggregate';
import { EmailCredentials } from '../../../domain/value-objects/email-credentials.vo';
import { EmailAccountDocument } from '../schemas/email-account.schema';

/**
 * Mapper between EmailAccount domain model and MongoDB document
 */
export class EmailAccountMapper {
  /**
   * Convert domain model to persistence document
   */
  static toPersistence(account: EmailAccount): Partial<EmailAccountDocument> {
    return {
      _id: account.id as any,
      userId: account.getUserId(),
      email: account.getEmail().getValue(),
      displayName: account.getDisplayName(),
      credentials: {
        username: account.getCredentials().getUsername(),
        password: account.getCredentials().getPassword(),
      },
      smtpConfig: account.getSmtpConfig(),
      imapConfig: account.getImapConfig(),
      status: account.getStatus(),
      lastSyncAt: account.getLastSyncAt(),
      errorMessage: account.getErrorMessage(),
    };
  }

  /**
   * Convert persistence document to domain model
   */
  static toDomain(doc: EmailAccountDocument): EmailAccount {
    const emailVo = Email.create(doc.email);
    const credentials = EmailCredentials.create(doc.credentials.username, doc.credentials.password);

    return EmailAccount.reconstitute(doc.id, {
      userId: doc.userId,
      email: emailVo,
      displayName: doc.displayName,
      credentials,
      smtpConfig: doc.smtpConfig,
      imapConfig: doc.imapConfig,
      status: doc.status as EmailAccountStatus,
      lastSyncAt: doc.lastSyncAt,
      errorMessage: doc.errorMessage,
    });
  }
}
