import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { UpdateProfileCommand } from './update-profile.command';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';

@CommandHandler(UpdateProfileCommand)
export class UpdateProfileHandler
  implements ICommandHandler<UpdateProfileCommand>
{
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(command: UpdateProfileCommand): Promise<{
    id: string;
    email: string;
    fullName: string;
    role: string;
  }> {
    const { userId, fullName } = command;

    // Find user by ID
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update profile fields
    if (fullName !== undefined) {
      user.updateProfile(fullName);
    }

    // Save changes
    await this.userRepository.save(user);

    // Return updated profile
    return {
      id: user.id,
      email: user.getEmail().getValue(),
      fullName: user.getFullName(),
      role: user.getRole(),
    };
  }
}
