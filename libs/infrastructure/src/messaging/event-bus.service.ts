import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent } from '@app/domain';

/**
 * Event Bus Service for publishing and subscribing to domain events
 * This is a simple in-memory implementation
 * For production, use Redis Pub/Sub, RabbitMQ, or AWS EventBridge
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);
  private handlers: Map<string, Array<(event: DomainEvent) => void>> =
    new Map();

  /**
   * Publish a domain event
   */
  async publish(event: DomainEvent): Promise<void> {
    this.logger.log(`Publishing event: ${event.eventType}`);

    const handlers = this.handlers.get(event.eventType) || [];

    for (const handler of handlers) {
      try {
        await handler(event);
      } catch (error) {
        this.logger.error(
          `Error handling event ${event.eventType}: ${error.message}`,
        );
      }
    }
  }

  /**
   * Subscribe to a domain event
   */
  subscribe(eventType: string, handler: (event: DomainEvent) => void): void {
    this.logger.log(`Subscribing to event: ${eventType}`);

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType).push(handler);
  }

  /**
   * Publish multiple events
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
