import { ValueObject } from '@app/domain';
import * as bcrypt from 'bcryptjs';

interface PasswordProps {
  value: string;
  hashed: boolean;
}

/**
 * Password Value Object
 * Handles password hashing and validation
 */
export class Password extends ValueObject<PasswordProps> {
  private static readonly MIN_LENGTH = 8;
  private static readonly SALT_ROUNDS = 10;

  private constructor(props: PasswordProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  getValue(): string {
    return this.props.value;
  }

  get isHashed(): boolean {
    return this.props.hashed;
  }

  /**
   * Create password from plain text (will be hashed)
   */
  static async create(plainPassword: string): Promise<Password> {
    if (!this.isValid(plainPassword)) {
      throw new Error(`Password must be at least ${this.MIN_LENGTH} characters long`);
    }

    const hashedPassword = await bcrypt.hash(plainPassword, this.SALT_ROUNDS);

    return new Password({
      value: hashedPassword,
      hashed: true,
    });
  }

  /**
   * Create password from hashed value (from database)
   */
  static fromHash(hashedPassword: string): Password {
    return new Password({
      value: hashedPassword,
      hashed: true,
    });
  }

  /**
   * Compare plain password with hashed password
   */
  async compare(plainPassword: string): Promise<boolean> {
    if (!this.props.hashed) {
      throw new Error('Cannot compare unhashed password');
    }

    return bcrypt.compare(plainPassword, this.props.value);
  }

  private static isValid(password: string): boolean {
    return password && password.length >= this.MIN_LENGTH;
  }
}
