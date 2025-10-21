import { ValueObject } from '../base/value-object.base';

interface EmailProps {
  value: string;
}

/**
 * Email Value Object
 * Ensures email address is valid
 */
export class Email extends ValueObject<EmailProps> {
  private constructor(props: EmailProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(email: string): Email {
    if (!this.isValid(email)) {
      throw new Error(`Invalid email address: ${email}`);
    }

    return new Email({ value: email.toLowerCase().trim() });
  }

  private static isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  toString(): string {
    return this.value;
  }
}
