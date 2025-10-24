import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { ToggleStarCommand } from './toggle-star.command';
import { IEmailRepository } from '../../domain/repositories/email.repository.interface';

@CommandHandler(ToggleStarCommand)
export class ToggleStarHandler implements ICommandHandler<ToggleStarCommand> {
  constructor(
    @Inject('IEmailRepository')
    private readonly emailRepository: IEmailRepository,
  ) {}

  async execute(command: ToggleStarCommand): Promise<void> {
    const email = await this.emailRepository.findById(command.emailId);

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    if (email.getUserId() !== command.userId) {
      throw new BadRequestException('Email does not belong to this user');
    }

    email.toggleStar();
    await this.emailRepository.save(email);
  }
}
