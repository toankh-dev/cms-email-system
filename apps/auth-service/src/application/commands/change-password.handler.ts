import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { ChangePasswordCommand } from './change-password.command';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { EventBusService } from '@app/infrastructure/messaging/event-bus.service';

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async execute(command: ChangePasswordCommand): Promise<{ success: boolean }> {
    const { userId, currentPassword, newPassword } = command;

    // Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Change password
    await user.changePassword(currentPassword, newPassword);
    await this.userRepository.save(user);

    // Publish domain events
    const events = user.getDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    user.clearEvents();

    return { success: true };
  }
}
