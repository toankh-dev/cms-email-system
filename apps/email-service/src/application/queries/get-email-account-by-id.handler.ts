import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetEmailAccountByIdQuery } from './get-email-account-by-id.query';
import { IEmailAccountRepository } from '../../domain/repositories/email-account.repository.interface';

@QueryHandler(GetEmailAccountByIdQuery)
export class GetEmailAccountByIdHandler
  implements IQueryHandler<GetEmailAccountByIdQuery>
{
  constructor(
    @Inject('IEmailAccountRepository')
    private readonly repository: IEmailAccountRepository,
  ) {}

  async execute(query: GetEmailAccountByIdQuery): Promise<any> {
    const { emailAccountId, userId } = query;

    const account = await this.repository.findById(emailAccountId);
    if (!account) {
      throw new NotFoundException('Email account not found');
    }

    // Verify ownership
    if (account.getUserId() !== userId) {
      throw new ForbiddenException('Not authorized to view this email account');
    }

    return {
      id: account.id,
      email: account.getEmail().getValue(),
      displayName: account.getDisplayName(),
      smtpConfig: account.getSmtpConfig(),
      imapConfig: account.getImapConfig(),
      status: account.getStatus(),
      lastSyncAt: account.getLastSyncAt(),
      errorMessage: account.getErrorMessage(),
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
