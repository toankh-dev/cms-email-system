// Email Account Commands
export * from './create-email-account.command';
export * from './create-email-account.handler';
export * from './update-email-account.command';
export * from './update-email-account.handler';
export * from './delete-email-account.command';
export * from './delete-email-account.handler';

// Folder Commands
export * from './initialize-folders.command';
export * from './initialize-folders.handler';
export * from './create-folder.command';
export * from './create-folder.handler';
export * from './update-folder.command';
export * from './update-folder.handler';
export * from './delete-folder.command';
export * from './delete-folder.handler';

// Email Commands
export * from './send-email.command';
export * from './send-email.handler';
export * from './save-draft.command';
export * from './save-draft.handler';
export * from './mark-as-read.command';
export * from './mark-as-read.handler';
export * from './toggle-star.command';
export * from './toggle-star.handler';
export * from './move-email.command';
export * from './move-email.handler';

import { CreateEmailAccountHandler } from './create-email-account.handler';
import { UpdateEmailAccountHandler } from './update-email-account.handler';
import { DeleteEmailAccountHandler } from './delete-email-account.handler';
import { InitializeFoldersHandler } from './initialize-folders.handler';
import { CreateFolderHandler } from './create-folder.handler';
import { UpdateFolderHandler } from './update-folder.handler';
import { DeleteFolderHandler } from './delete-folder.handler';
import { SendEmailHandler } from './send-email.handler';
import { SaveDraftHandler } from './save-draft.handler';
import { MarkAsReadHandler } from './mark-as-read.handler';
import { ToggleStarHandler } from './toggle-star.handler';
import { MoveEmailHandler } from './move-email.handler';

export const CommandHandlers = [
  // Email Account handlers
  CreateEmailAccountHandler,
  UpdateEmailAccountHandler,
  DeleteEmailAccountHandler,
  // Folder handlers
  InitializeFoldersHandler,
  CreateFolderHandler,
  UpdateFolderHandler,
  DeleteFolderHandler,
  // Email handlers
  SendEmailHandler,
  SaveDraftHandler,
  MarkAsReadHandler,
  ToggleStarHandler,
  MoveEmailHandler,
];
