import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { MarkAsReadCommand } from './mark-as-read.command';
import { IEmailRepository } from '../../domain/repositories/email.repository.interface';

@CommandHandler(MarkAsReadCommand)
export class MarkAsReadHandler implements ICommandHandler<MarkAsReadCommand> {
  constructor(
    @Inject('IEmailRepository')
    private readonly emailRepository: IEmailRepository,
  ) {}

  async execute(command: MarkAsReadCommand): Promise<void> {
    const email = await this.emailRepository.findById(command.emailId);

    if (!email) {
      throw new NotFoundException('Email not found');
    }

    if (email.getUserId() !== command.userId) {
      throw new BadRequestException('Email does not belong to this user');
    }

    if (command.isRead) {
      email.markAsRead();
    } else {
      email.markAsUnread();
    }

    await this.emailRepository.save(email);
  }
}
