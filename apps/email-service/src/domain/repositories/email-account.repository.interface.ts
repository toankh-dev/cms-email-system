import { EmailAccount } from '../models/email-account.aggregate';

/**
 * Repository interface for EmailAccount aggregate
 */
export interface IEmailAccountRepository {
  /**
   * Save email account (create or update)
   */
  save(account: EmailAccount): Promise<EmailAccount>;

  /**
   * Find email account by ID
   */
  findById(id: string): Promise<EmailAccount | null>;

  /**
   * Find all email accounts for a user
   */
  findByUserId(userId: string): Promise<EmailAccount[]>;

  /**
   * Find email account by email address
   */
  findByEmail(userId: string, email: string): Promise<EmailAccount | null>;

  /**
   * Delete email account
   */
  delete(id: string): Promise<void>;

  /**
   * Find all active accounts (for sync jobs)
   */
  findAllActive(): Promise<EmailAccount[]>;
}
