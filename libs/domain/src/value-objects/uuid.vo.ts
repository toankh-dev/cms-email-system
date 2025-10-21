import { ValueObject } from '../base/value-object.base';
import { randomUUID } from 'crypto';

interface UUIDProps {
  value: string;
}

/**
 * UUID Value Object
 */
export class UUID extends ValueObject<UUIDProps> {
  private constructor(props: UUIDProps) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(uuid?: string): UUID {
    const value = uuid || randomUUID();

    if (!this.isValid(value)) {
      throw new Error(`Invalid UUID: ${value}`);
    }

    return new UUID({ value });
  }

  private static isValid(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  toString(): string {
    return this.value;
  }
}
