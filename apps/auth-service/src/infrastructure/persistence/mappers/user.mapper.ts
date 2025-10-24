import { User, UserRole, UserStatus } from '../../../domain/models/user.aggregate';
import { RefreshToken } from '../../../domain/models/refresh-token.entity';
import { Password } from '../../../domain/models/password.vo';
import { Email } from '@app/domain/value-objects/email.vo';
import { UserEntity } from '../entities/user.entity';
import { RefreshTokenEntity } from '../entities/refresh-token.entity';

export class UserMapper {
  /**
   * Convert Domain Model to TypeORM Entity
   */
  static toPersistence(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.email = user.getEmail().getValue();
    entity.password = user['password'].getValue(); // Access private property
    entity.fullName = user.getFullName();
    entity.role = user.getRole();
    entity.status = user.getStatus();
    entity.lastLoginAt = user.getLastLoginAt() || null;
    entity.emailVerified = user.isEmailVerified();
    entity.emailVerificationToken = user.getEmailVerificationToken() || null;
    entity.passwordResetToken = user.getPasswordResetToken() || null;
    entity.passwordResetExpires = user.getPasswordResetExpires() || null;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;

    // Map refresh tokens
    entity.refreshTokens = user.getRefreshTokens().map(token => {
      const tokenEntity = new RefreshTokenEntity();
      tokenEntity.id = token.id;
      tokenEntity.token = token.getToken();
      tokenEntity.userId = user.id;
      tokenEntity.expiresAt = token.getExpiresAt();
      tokenEntity.isRevoked = token.getIsRevoked();
      tokenEntity.createdAt = token.createdAt;
      tokenEntity.updatedAt = token.updatedAt;
      return tokenEntity;
    });

    return entity;
  }

  /**
   * Convert TypeORM Entity to Domain Model
   */
  static toDomain(entity: UserEntity): User {
    const email = Email.create(entity.email);
    const password = Password.fromHash(entity.password);

    const refreshTokens = (entity.refreshTokens || []).map(tokenEntity =>
      RefreshToken.reconstitute(
        tokenEntity.id,
        tokenEntity.token,
        tokenEntity.expiresAt,
        tokenEntity.isRevoked,
        tokenEntity.createdAt,
        tokenEntity.updatedAt,
      ),
    );

    return User.reconstitute(entity.id, {
      email,
      password,
      fullName: entity.fullName,
      role: entity.role as UserRole,
      status: entity.status as UserStatus,
      refreshTokens,
      lastLoginAt: entity.lastLoginAt || undefined,
      emailVerified: entity.emailVerified,
      emailVerificationToken: entity.emailVerificationToken || undefined,
      passwordResetToken: entity.passwordResetToken || undefined,
      passwordResetExpires: entity.passwordResetExpires || undefined,
    });
  }
}
