export * from './get-user-by-id.query';
export * from './get-user-by-id.handler';

import { GetUserByIdHandler } from './get-user-by-id.handler';

export const QueryHandlers = [GetUserByIdHandler];
