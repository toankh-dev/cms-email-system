import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ResetPasswordCommand } from './reset-password.command';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler
  implements ICommandHandler<ResetPasswordCommand>
{
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: ResetPasswordCommand): Promise<{ success: boolean }> {
    const { token, newPassword } = command;

    // Find user by password reset token
    const user = await this.userRepository.findByPasswordResetToken(token);
    if (!user) {
      throw new NotFoundException('Invalid or expired password reset token');
    }

    try {
      // Reset password (this also validates the token and expiry)
      await user.resetPassword(token, newPassword);
      await this.userRepository.save(user);

      return { success: true };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
