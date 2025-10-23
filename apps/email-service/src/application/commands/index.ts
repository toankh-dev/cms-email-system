export * from './create-email-account.command';
export * from './create-email-account.handler';
export * from './update-email-account.command';
export * from './update-email-account.handler';
export * from './delete-email-account.command';
export * from './delete-email-account.handler';

import { CreateEmailAccountHandler } from './create-email-account.handler';
import { UpdateEmailAccountHandler } from './update-email-account.handler';
import { DeleteEmailAccountHandler } from './delete-email-account.handler';

export const CommandHandlers = [CreateEmailAccountHandler, UpdateEmailAccountHandler, DeleteEmailAccountHandler];
