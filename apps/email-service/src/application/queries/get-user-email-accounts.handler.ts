import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUserEmailAccountsQuery } from './get-user-email-accounts.query';
import { IEmailAccountRepository } from '../../domain/repositories/email-account.repository.interface';

@QueryHandler(GetUserEmailAccountsQuery)
export class GetUserEmailAccountsHandler
  implements IQueryHandler<GetUserEmailAccountsQuery>
{
  constructor(
    @Inject('IEmailAccountRepository')
    private readonly repository: IEmailAccountRepository,
  ) {}

  async execute(query: GetUserEmailAccountsQuery): Promise<any[]> {
    const { userId } = query;

    const accounts = await this.repository.findByUserId(userId);

    return accounts.map((account) => ({
      id: account.id,
      email: account.getEmail().getValue(),
      displayName: account.getDisplayName(),
      status: account.getStatus(),
      lastSyncAt: account.getLastSyncAt(),
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));
  }
}
