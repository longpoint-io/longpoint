import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventKey, PlatformEventPayloads } from './event.types';

export abstract class EventPublisher {
  abstract publish<T extends EventKey>(
    event: T,
    payload: PlatformEventPayloads[T]
  ): Promise<void>;
}

@Injectable()
export class InMemoryEventPublisher extends EventPublisher {
  constructor(private readonly eventEmitter: EventEmitter2) {
    super();
  }

  async publish<T extends EventKey>(
    event: T,
    payload: PlatformEventPayloads[T]
  ): Promise<void> {
    this.eventEmitter.emit(event, payload);
  }
}
