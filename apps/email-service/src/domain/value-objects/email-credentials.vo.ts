/**
 * Email Credentials Value Object
 * Encapsulates SMTP/IMAP credentials with validation
 */
export class EmailCredentials {
  private constructor(
    private readonly _username: string,
    private readonly _password: string,
  ) {}

  static create(username: string, password: string): EmailCredentials {
    if (!username || username.trim().length === 0) {
      throw new Error('Username cannot be empty');
    }
    if (!password || password.trim().length === 0) {
      throw new Error('Password cannot be empty');
    }

    return new EmailCredentials(username.trim(), password);
  }

  getUsername(): string {
    return this._username;
  }

  getPassword(): string {
    return this._password;
  }

  equals(other: EmailCredentials): boolean {
    return (
      this._username === other._username && this._password === other._password
    );
  }
}
