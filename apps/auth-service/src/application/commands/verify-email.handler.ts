import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { VerifyEmailCommand } from './verify-email.command';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

@CommandHandler(VerifyEmailCommand)
export class VerifyEmailHandler implements ICommandHandler<VerifyEmailCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: VerifyEmailCommand): Promise<{ success: boolean }> {
    const { token } = command;

    // Find user by verification token
    const user = await this.userRepository.findByEmailVerificationToken(token);
    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }

    // Verify email
    user.verifyEmail(token);
    await this.userRepository.save(user);

    return { success: true };
  }
}
