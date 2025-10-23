import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, UnauthorizedException } from '@nestjs/common';
import { RefreshTokenCommand } from './refresh-token.command';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { JwtService } from '@nestjs/jwt';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: RefreshTokenCommand): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const { refreshToken } = command;

    // Decode refresh token to get user ID (we'll store userId in refresh token)
    // For now, we'll find user by scanning all users (not efficient, will optimize later)
    // In production, store userId with refresh token in database

    // Find all users and validate token
    const users = await this.userRepository.findAll();
    let validUser = null;

    for (const user of users) {
      const token = user.validateRefreshToken(refreshToken);
      if (token) {
        validUser = user;
        break;
      }
    }

    if (!validUser) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new access token
    const accessToken = this.jwtService.sign({
      sub: validUser.id,
      email: validUser.getEmail().getValue(),
      role: validUser.getRole(),
    });

    // Generate new refresh token
    const newRefreshToken = validUser.generateRefreshToken();
    await this.userRepository.save(validUser);

    return {
      accessToken,
      refreshToken: newRefreshToken.getToken(),
    };
  }
}
