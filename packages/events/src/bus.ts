import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import type Redis from 'ioredis';
import type {
  EventType,
  ProductOSEvent,
  EventHandler,
  EventMetadata,
  PayloadOf,
} from './types';
import { ProductOSEventSchema } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STREAM_KEY = 'product-os:events';

/** Check whether an event type matches a dot-separated glob pattern. */
function matchesPattern(eventType: string, pattern: string): boolean {
  const regex = new RegExp(
    `^${pattern.replace(/\./g, '\\.').replace(/\*/g, '[^.]*')}$`,
  );
  return regex.test(eventType);
}

// ---------------------------------------------------------------------------
// EventBus
// ---------------------------------------------------------------------------

export class EventBus {
  private emitter = new EventEmitter();
  private handlers = new Map<string, Set<EventHandler<any>>>();
  private patternHandlers = new Map<string, Set<EventHandler<any>>>();
  private redis: Redis | null = null;
  private redisUrl: string | null;
  private consuming = false;

  constructor(redisUrl?: string | null) {
    this.redisUrl = redisUrl ?? null;
    this.emitter.setMaxListeners(100);
  }

  // -----------------------------------------------------------------------
  // Redis connection (lazy)
  // -----------------------------------------------------------------------

  private async getRedis(): Promise<Redis | null> {
    if (this.redis) return this.redis;
    if (!this.redisUrl) return null;

    try {
      const { default: IORedis } = await import('ioredis');
      this.redis = new IORedis(this.redisUrl, { maxRetriesPerRequest: 3 });
      return this.redis;
    } catch {
      console.warn('[EventBus] Redis unavailable — falling back to in-memory.');
      this.redisUrl = null;
      return null;
    }
  }

  // -----------------------------------------------------------------------
  // Emit
  // -----------------------------------------------------------------------

  /**
   * Build and emit a fully-formed ProductOSEvent.
   *
   * Publishes to a Redis Stream when Redis is available; otherwise
   * dispatches locally via the in-memory EventEmitter.
   */
  async emit<T extends EventType>(
    type: T,
    opts: {
      productId: string;
      actorId: string;
      payload: PayloadOf<T>;
      metadata?: Partial<EventMetadata>;
    },
  ): Promise<ProductOSEvent<T>> {
    const event: ProductOSEvent<T> = {
      id: randomUUID(),
      type,
      productId: opts.productId,
      actorId: opts.actorId,
      timestamp: new Date().toISOString(),
      payload: opts.payload,
      metadata: {
        version: 1,
        ...opts.metadata,
      },
    };

    // Validate the envelope (throws on malformed events)
    ProductOSEventSchema.parse(event);

    const redis = await this.getRedis();

    if (redis) {
      await redis.xadd(
        STREAM_KEY,
        '*',
        'type',
        event.type,
        'data',
        JSON.stringify(event),
      );
    }

    // Always dispatch locally so in-process handlers run regardless of Redis
    this.dispatch(event);

    return event;
  }

  /**
   * Emit a pre-built event object directly.
   */
  async emitRaw(event: ProductOSEvent): Promise<void> {
    ProductOSEventSchema.parse(event);

    const redis = await this.getRedis();

    if (redis) {
      await redis.xadd(
        STREAM_KEY,
        '*',
        'type',
        event.type,
        'data',
        JSON.stringify(event),
      );
    }

    this.dispatch(event);
  }

  // -----------------------------------------------------------------------
  // Subscribe / On
  // -----------------------------------------------------------------------

  /**
   * Register a handler for an exact event type.
   * Returns an unsubscribe function.
   */
  on<T extends EventType>(type: T, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler as EventHandler<any>);

    return () => {
      this.handlers.get(type)?.delete(handler as EventHandler<any>);
    };
  }

  /**
   * Subscribe to one or more dot-separated glob patterns (e.g. `graph.*`).
   * Returns an unsubscribe function that removes all registered patterns.
   */
  subscribe(
    patterns: string[],
    handler: EventHandler,
  ): () => void {
    for (const pattern of patterns) {
      if (!this.patternHandlers.has(pattern)) {
        this.patternHandlers.set(pattern, new Set());
      }
      this.patternHandlers.get(pattern)!.add(handler);
    }

    return () => {
      for (const pattern of patterns) {
        this.patternHandlers.get(pattern)?.delete(handler);
      }
    };
  }

  // -----------------------------------------------------------------------
  // Consumer group (Redis Streams)
  // -----------------------------------------------------------------------

  /**
   * Start consuming events from a Redis Stream consumer group.
   *
   * Each message is dispatched to local handlers. In development mode
   * (no Redis) this is a no-op because events are already dispatched
   * locally on `emit`.
   */
  async startConsumer(groupName: string, consumerName?: string): Promise<void> {
    const redis = await this.getRedis();

    if (!redis) {
      console.info(
        '[EventBus] No Redis connection — consumer running in local-only mode.',
      );
      return;
    }

    const consumer = consumerName ?? `consumer-${randomUUID().slice(0, 8)}`;

    // Create the consumer group if it doesn't exist yet.
    try {
      await redis.xgroup('CREATE', STREAM_KEY, groupName, '0', 'MKSTREAM');
    } catch (err: any) {
      // BUSYGROUP means the group already exists — that's fine.
      if (!err.message?.includes('BUSYGROUP')) throw err;
    }

    this.consuming = true;

    const poll = async () => {
      while (this.consuming) {
        try {
          const results = await redis.xreadgroup(
            'GROUP',
            groupName,
            consumer,
            'COUNT',
            10,
            'BLOCK',
            2000,
            'STREAMS',
            STREAM_KEY,
            '>',
          );

          if (!results) continue;

          for (const [, messages] of results) {
            for (const [id, fields] of messages) {
              const dataIndex = fields.indexOf('data');
              if (dataIndex === -1) continue;

              const raw = fields[dataIndex + 1];
              try {
                const event = JSON.parse(raw) as ProductOSEvent;
                this.dispatch(event);
                await redis.xack(STREAM_KEY, groupName, id);
              } catch (err) {
                console.error('[EventBus] Failed to process message', id, err);
              }
            }
          }
        } catch (err) {
          if (this.consuming) {
            console.error('[EventBus] Consumer poll error:', err);
            // Back-off briefly before retrying
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
      }
    };

    // Start polling in the background (non-blocking).
    poll();
  }

  /**
   * Stop the consumer group polling loop.
   */
  stopConsumer(): void {
    this.consuming = false;
  }

  // -----------------------------------------------------------------------
  // Internal dispatch
  // -----------------------------------------------------------------------

  private dispatch(event: ProductOSEvent): void {
    // Exact-match handlers
    const exact = this.handlers.get(event.type);
    if (exact) {
      for (const handler of exact) {
        this.safeInvoke(handler, event);
      }
    }

    // Pattern-match handlers
    for (const [pattern, handlers] of this.patternHandlers) {
      if (matchesPattern(event.type, pattern)) {
        for (const handler of handlers) {
          this.safeInvoke(handler, event);
        }
      }
    }

    // Also emit on the Node EventEmitter for one-off listeners
    this.emitter.emit(event.type, event);
    this.emitter.emit('*', event);
  }

  private safeInvoke(handler: EventHandler, event: ProductOSEvent): void {
    try {
      const result = handler(event);
      // If the handler returns a promise, catch rejections.
      if (result && typeof (result as Promise<void>).catch === 'function') {
        (result as Promise<void>).catch((err) => {
          console.error(
            `[EventBus] Async handler error for ${event.type}:`,
            err,
          );
        });
      }
    } catch (err) {
      console.error(`[EventBus] Handler error for ${event.type}:`, err);
    }
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /**
   * Gracefully shut down — stop consumer and close Redis.
   */
  async destroy(): Promise<void> {
    this.stopConsumer();
    this.handlers.clear();
    this.patternHandlers.clear();
    this.emitter.removeAllListeners();

    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton — uses REDIS_URL env var when present, in-memory otherwise
// ---------------------------------------------------------------------------

export const eventBus = new EventBus(process.env.REDIS_URL ?? null);
