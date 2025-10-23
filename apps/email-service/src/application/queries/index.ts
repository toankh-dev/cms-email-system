export * from './get-email-account-by-id.query';
export * from './get-email-account-by-id.handler';
export * from './get-user-email-accounts.query';
export * from './get-user-email-accounts.handler';

import { GetEmailAccountByIdHandler } from './get-email-account-by-id.handler';
import { GetUserEmailAccountsHandler } from './get-user-email-accounts.handler';

export const QueryHandlers = [
  GetEmailAccountByIdHandler,
  GetUserEmailAccountsHandler,
];
