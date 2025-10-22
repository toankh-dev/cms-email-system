import { AggregateRoot } from '@app/domain/base/aggregate-root.base';
import { Email } from '@app/domain/value-objects/email.vo';
import { Password } from './password.vo';
import { RefreshToken } from './refresh-token.entity';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserLoggedInEvent } from '../events/user-logged-in.event';
import { PasswordChangedEvent } from '../events/password-changed.event';
import { PasswordResetRequestedEvent } from '../events/password-reset-requested.event';
import { randomUUID } from 'crypto';

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export interface UserProps {
  email: Email;
  password: Password;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  refreshTokens: RefreshToken[];
  lastLoginAt?: Date;
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

export class User extends AggregateRoot<string> {
  private email: Email;
  private password: Password;
  private fullName: string;
  private role: UserRole;
  private status: UserStatus;
  private refreshTokens: RefreshToken[];
  private lastLoginAt?: Date;
  private emailVerified: boolean;
  private emailVerificationToken?: string;
  private passwordResetToken?: string;
  private passwordResetExpires?: Date;

  private constructor(id: string, props: UserProps) {
    super(id);
    this.email = props.email;
    this.password = props.password;
    this.fullName = props.fullName;
    this.role = props.role;
    this.status = props.status;
    this.refreshTokens = props.refreshTokens;
    this.lastLoginAt = props.lastLoginAt;
    this.emailVerified = props.emailVerified;
    this.emailVerificationToken = props.emailVerificationToken;
    this.passwordResetToken = props.passwordResetToken;
    this.passwordResetExpires = props.passwordResetExpires;
  }

  /**
   * Factory method to create a new User
   */
  static async create(
    email: Email,
    plainPassword: string,
    fullName: string,
    role: UserRole = UserRole.USER,
  ): Promise<User> {
    const id = randomUUID();
    const password = await Password.create(plainPassword);
    const emailVerificationToken = randomUUID();

    const user = new User(id, {
      email,
      password,
      fullName,
      role,
      status: UserStatus.INACTIVE, // Inactive until email verified
      refreshTokens: [],
      emailVerified: false,
      emailVerificationToken,
    });

    // Publish domain event
    user.addDomainEvent(
      new UserCreatedEvent({
        aggregateId: id,
        email: email.getValue(),
        fullName,
        role,
        emailVerificationToken,
      }),
    );

    return user;
  }

  /**
   * Reconstitute User from persistence
   */
  static reconstitute(id: string, props: UserProps): User {
    return new User(id, props);
  }

  /**
   * Verify email with token
   */
  verifyEmail(token: string): void {
    if (this.emailVerified) {
      throw new Error('Email already verified');
    }

    if (this.emailVerificationToken !== token) {
      throw new Error('Invalid verification token');
    }

    this.emailVerified = true;
    this.emailVerificationToken = undefined;
    this.status = UserStatus.ACTIVE;
    this.touch();
  }

  /**
   * Authenticate user with password
   */
  async authenticate(plainPassword: string): Promise<boolean> {
    if (this.status !== UserStatus.ACTIVE) {
      throw new Error('User account is not active');
    }

    const isValid = await this.password.compare(plainPassword);

    if (isValid) {
      this.lastLoginAt = new Date();
      this.touch();

      // Publish domain event
      this.addDomainEvent(
        new UserLoggedInEvent({
          aggregateId: this._id,
          email: this.email.getValue(),
          loginAt: this.lastLoginAt,
        }),
      );
    }

    return isValid;
  }

  /**
   * Generate new refresh token
   */
  generateRefreshToken(expiresInDays: number = 7): RefreshToken {
    if (this.status !== UserStatus.ACTIVE) {
      throw new Error('User account is not active');
    }

    // Revoke old expired tokens
    this.refreshTokens
      .filter((token) => token.isExpired())
      .forEach((token) => token.revoke());

    // Limit to 5 active refresh tokens per user
    const activeTokens = this.refreshTokens.filter((token) => token.isValid());
    if (activeTokens.length >= 5) {
      // Revoke oldest token
      activeTokens[0].revoke();
    }

    const refreshToken = RefreshToken.create(expiresInDays);
    this.refreshTokens.push(refreshToken);
    this.touch();

    return refreshToken;
  }

  /**
   * Validate and get refresh token
   */
  validateRefreshToken(tokenValue: string): RefreshToken | null {
    const token = this.refreshTokens.find(
      (t) => t.getToken() === tokenValue && t.isValid(),
    );

    return token || null;
  }

  /**
   * Revoke specific refresh token
   */
  revokeRefreshToken(tokenValue: string): void {
    const token = this.refreshTokens.find((t) => t.getToken() === tokenValue);

    if (!token) {
      throw new Error('Refresh token not found');
    }

    token.revoke();
    this.touch();
  }

  /**
   * Revoke all refresh tokens (logout from all devices)
   */
  revokeAllRefreshTokens(): void {
    this.refreshTokens.forEach((token) => {
      if (token.isValid()) {
        token.revoke();
      }
    });
    this.touch();
  }

  /**
   * Change password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const isCurrentPasswordValid =
      await this.password.compare(currentPassword);

    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    this.password = await Password.create(newPassword);
    this.revokeAllRefreshTokens(); // Security: revoke all sessions
    this.touch();

    // Publish domain event
    this.addDomainEvent(
      new PasswordChangedEvent({
        aggregateId: this._id,
        email: this.email.getValue(),
        changedAt: new Date(),
      }),
    );
  }

  /**
   * Request password reset (generates token)
   */
  requestPasswordReset(): string {
    const token = randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token valid for 1 hour

    this.passwordResetToken = token;
    this.passwordResetExpires = expiresAt;
    this.touch();

    // Publish domain event
    this.addDomainEvent(
      new PasswordResetRequestedEvent({
        aggregateId: this._id,
        email: this.email.getValue(),
        passwordResetToken: token,
        requestedAt: new Date(),
      }),
    );

    return token;
  }

  /**
   * Verify password reset token
   */
  verifyPasswordResetToken(token: string): boolean {
    if (!this.passwordResetToken || !this.passwordResetExpires) {
      return false;
    }

    if (this.passwordResetToken !== token) {
      return false;
    }

    if (new Date() > this.passwordResetExpires) {
      return false; // Token expired
    }

    return true;
  }

  /**
   * Reset password (for forgot password flow)
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!this.verifyPasswordResetToken(token)) {
      throw new Error('Invalid or expired password reset token');
    }

    this.password = await Password.create(newPassword);
    this.passwordResetToken = undefined;
    this.passwordResetExpires = undefined;
    this.revokeAllRefreshTokens(); // Security: revoke all sessions
    this.touch();

    // Publish domain event
    this.addDomainEvent(
      new PasswordChangedEvent({
        aggregateId: this._id,
        email: this.email.getValue(),
        changedAt: new Date(),
      }),
    );
  }

  /**
   * Update user profile
   */
  updateProfile(fullName: string): void {
    this.fullName = fullName;
    this.touch();
  }

  /**
   * Change user role (admin only)
   */
  changeRole(newRole: UserRole): void {
    this.role = newRole;
    this.touch();
  }

  /**
   * Suspend user account
   */
  suspend(): void {
    if (this.status === UserStatus.SUSPENDED) {
      throw new Error('User already suspended');
    }

    this.status = UserStatus.SUSPENDED;
    this.revokeAllRefreshTokens();
    this.touch();
  }

  /**
   * Activate user account
   */
  activate(): void {
    if (!this.emailVerified) {
      throw new Error('Email must be verified before activation');
    }

    this.status = UserStatus.ACTIVE;
    this.touch();
  }

  // Getters
  getEmail(): Email {
    return this.email;
  }

  getFullName(): string {
    return this.fullName;
  }

  getRole(): UserRole {
    return this.role;
  }

  getStatus(): UserStatus {
    return this.status;
  }

  getRefreshTokens(): RefreshToken[] {
    return [...this.refreshTokens]; // Return copy
  }

  getLastLoginAt(): Date | undefined {
    return this.lastLoginAt;
  }

  isEmailVerified(): boolean {
    return this.emailVerified;
  }

  getEmailVerificationToken(): string | undefined {
    return this.emailVerificationToken;
  }

  getPasswordResetToken(): string | undefined {
    return this.passwordResetToken;
  }

  getPasswordResetExpires(): Date | undefined {
    return this.passwordResetExpires;
  }

  isActive(): boolean {
    return this.status === UserStatus.ACTIVE && this.emailVerified;
  }
}
