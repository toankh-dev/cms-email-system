import { Entity } from './entity.base';
import { DomainEvent } from '../events/domain-event.base';

/**
 * Aggregate Root base class for DDD
 * Aggregate roots are entities that can publish domain events
 */
export abstract class AggregateRoot<T> extends Entity<T> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Apply domain event (for event sourcing)
   */
  protected apply(event: DomainEvent): void {
    this.addDomainEvent(event);
    // Override in child classes to handle state changes
  }
}
