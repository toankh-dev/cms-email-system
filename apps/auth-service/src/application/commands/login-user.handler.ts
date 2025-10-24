import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { LoginUserCommand } from './login-user.command';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { Email } from '@app/domain/value-objects/email.vo';
import { EventBusService } from '@app/infrastructure/messaging/event-bus.service';
import { JwtService } from '@nestjs/jwt';

@CommandHandler(LoginUserCommand)
export class LoginUserHandler implements ICommandHandler<LoginUserCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBusService,
    private readonly jwtService: JwtService,
  ) {}

  async execute(command: LoginUserCommand): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      fullName: string;
      role: string;
    };
  }> {
    const { email, password } = command;

    // Create Email value object
    const emailVO = Email.create(email);

    // Find user
    const user = await this.userRepository.findByEmail(emailVO);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Authenticate
    const isValid = await user.authenticate(password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.getEmail().getValue(),
      role: user.getRole(),
    });

    const refreshTokenEntity = user.generateRefreshToken();
    await this.userRepository.save(user);

    // Publish domain events
    const events = user.getDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    user.clearEvents();

    return {
      accessToken,
      refreshToken: refreshTokenEntity.getToken(),
      user: {
        id: user.id,
        email: user.getEmail().getValue(),
        fullName: user.getFullName(),
        role: user.getRole(),
      },
    };
  }
}
