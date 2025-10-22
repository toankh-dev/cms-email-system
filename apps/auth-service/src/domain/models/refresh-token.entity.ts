import { Entity } from '@app/domain';
import { randomBytes } from 'crypto';

/**
 * RefreshToken Entity
 * Part of User aggregate
 */
export class RefreshToken extends Entity<string> {
  private token: string;
  private expiresAt: Date;
  private isRevoked: boolean;

  private constructor(id: string, token: string, expiresAt: Date) {
    super(id);
    this.token = token;
    this.expiresAt = expiresAt;
    this.isRevoked = false;
  }

  static create(expiresInDays: number = 7): RefreshToken {
    const id = randomBytes(16).toString('hex');
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return new RefreshToken(id, token, expiresAt);
  }

  static fromPersistence(
    id: string,
    token: string,
    expiresAt: Date,
    isRevoked: boolean,
  ): RefreshToken {
    const refreshToken = new RefreshToken(id, token, expiresAt);
    refreshToken.isRevoked = isRevoked;
    return refreshToken;
  }

  static reconstitute(
    id: string,
    token: string,
    expiresAt: Date,
    isRevoked: boolean,
    createdAt: Date,
    updatedAt: Date,
  ): RefreshToken {
    const refreshToken = new RefreshToken(id, token, expiresAt);
    refreshToken.isRevoked = isRevoked;
    refreshToken._createdAt = createdAt;
    refreshToken._updatedAt = updatedAt;
    return refreshToken;
  }

  getToken(): string {
    return this.token;
  }

  getExpiresAt(): Date {
    return this.expiresAt;
  }

  getIsRevoked(): boolean {
    return this.isRevoked;
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isRevoked && !this.isExpired();
  }

  revoke(): void {
    this.isRevoked = true;
    this.touch();
  }
}
