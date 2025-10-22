import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, ConflictException } from '@nestjs/common';
import { RegisterUserCommand } from './register-user.command';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/models/user.aggregate';
import { Email } from '@app/domain/value-objects/email.vo';
import { EventBusService } from '@app/infrastructure/messaging/event-bus.service';

@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler
  implements ICommandHandler<RegisterUserCommand>
{
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async execute(command: RegisterUserCommand): Promise<{ userId: string; emailVerificationToken: string }> {
    const { email, password, fullName } = command;

    // Create Email value object
    const emailVO = Email.create(email);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(emailVO);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Create user aggregate
    const user = await User.create(emailVO, password, fullName);

    // Save user
    await this.userRepository.save(user);

    // Publish domain events
    const events = user.getDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    user.clearEvents();

    return {
      userId: user.id,
      emailVerificationToken: user.getEmailVerificationToken()!,
    };
  }
}
