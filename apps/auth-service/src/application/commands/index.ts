export * from './register-user.command';
export * from './register-user.handler';
export * from './login-user.command';
export * from './login-user.handler';
export * from './refresh-token.command';
export * from './refresh-token.handler';
export * from './verify-email.command';
export * from './verify-email.handler';
export * from './change-password.command';
export * from './change-password.handler';
export * from './forgot-password.command';
export * from './forgot-password.handler';
export * from './reset-password.command';
export * from './reset-password.handler';

import { RegisterUserHandler } from './register-user.handler';
import { LoginUserHandler } from './login-user.handler';
import { RefreshTokenHandler } from './refresh-token.handler';
import { VerifyEmailHandler } from './verify-email.handler';
import { ChangePasswordHandler } from './change-password.handler';
import { ForgotPasswordHandler } from './forgot-password.handler';
import { ResetPasswordHandler } from './reset-password.handler';

export const CommandHandlers = [
  RegisterUserHandler,
  LoginUserHandler,
  RefreshTokenHandler,
  VerifyEmailHandler,
  ChangePasswordHandler,
  ForgotPasswordHandler,
  ResetPasswordHandler,
];
