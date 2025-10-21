/**
 * Base Domain Event for Event Sourcing and Event-Driven Architecture
 * Following CloudEvents specification
 */
export abstract class DomainEvent {
  public readonly id: string;
  public readonly occurredOn: Date;
  public readonly eventType: string;
  public readonly aggregateId: string;
  public readonly correlationId?: string;
  public readonly causationId?: string;

  constructor(
    aggregateId: string,
    eventType: string,
    correlationId?: string,
    causationId?: string,
  ) {
    this.id = this.generateId();
    this.occurredOn = new Date();
    this.eventType = eventType;
    this.aggregateId = aggregateId;
    this.correlationId = correlationId;
    this.causationId = causationId;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get event data for serialization
   */
  abstract getData(): Record<string, any>;

  /**
   * Convert to CloudEvents format
   */
  toCloudEvent() {
    return {
      id: this.id,
      type: this.eventType,
      source: 'cms-email-system',
      time: this.occurredOn.toISOString(),
      datacontenttype: 'application/json',
      data: {
        aggregateId: this.aggregateId,
        ...this.getData(),
      },
      correlationid: this.correlationId,
      causationid: this.causationId,
    };
  }
}
