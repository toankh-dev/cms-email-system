import { User } from '../models/user.aggregate';
import { Email } from '@app/domain/value-objects/email.vo';

export interface IUserRepository {
  /**
   * Save user (create or update)
   */
  save(user: User): Promise<User>;

  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Find user by email verification token
   */
  findByEmailVerificationToken(token: string): Promise<User | null>;

  /**
   * Find user by password reset token
   */
  findByPasswordResetToken(token: string): Promise<User | null>;

  /**
   * Check if email exists
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * Delete user
   */
  delete(id: string): Promise<void>;

  /**
   * Find all users (for admin)
   */
  findAll(limit?: number, offset?: number): Promise<User[]>;

  /**
   * Count total users
   */
  count(): Promise<number>;
}
