import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { ForgotPasswordCommand } from './forgot-password.command';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { Email } from '@app/domain/value-objects/email.vo';

@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler implements ICommandHandler<ForgotPasswordCommand> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: ForgotPasswordCommand): Promise<{ success: boolean; token: string }> {
    const { email: emailString } = command;

    // Create Email value object
    const email = Email.create(emailString);

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate password reset token
    const token = user.requestPasswordReset();
    await this.userRepository.save(user);

    // TODO: In production, send token via email service instead of returning it
    return { success: true, token };
  }
}
