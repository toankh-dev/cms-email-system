export * from './get-email-account-by-id.query';
export * from './get-email-account-by-id.handler';
export * from './get-user-email-accounts.query';
export * from './get-user-email-accounts.handler';
export * from './get-folder-by-id.query';
export * from './get-folder-by-id.handler';
export * from './get-folders-by-account.query';
export * from './get-folders-by-account.handler';

import { GetEmailAccountByIdHandler } from './get-email-account-by-id.handler';
import { GetUserEmailAccountsHandler } from './get-user-email-accounts.handler';
import { GetFolderByIdHandler } from './get-folder-by-id.handler';
import { GetFoldersByAccountHandler } from './get-folders-by-account.handler';

export const QueryHandlers = [
  GetEmailAccountByIdHandler,
  GetUserEmailAccountsHandler,
  GetFolderByIdHandler,
  GetFoldersByAccountHandler,
];
