# Kafka Service

This directory contains the Kafka message broker service implementation for the zaaz-server project.

## Overview

The Kafka service provides a robust, production-ready implementation for publishing and consuming messages using Apache Kafka. It follows the same architectural pattern as the RabbitMQ service for consistency.

## Files

- **index.ts** - Main Kafka service implementation

## Features

### Producer

- ✅ Idempotent producer (exactly-once delivery)
- ✅ Transactional support
- ✅ Message confirmation
- ✅ Automatic topic creation
- ✅ Partition key support

### Consumer

- ✅ Consumer groups for scalability
- ✅ Automatic offset management
- ✅ Dead Letter Topic (DLT) for failed messages
- ✅ Error handling with validation
- ✅ Automatic reconnection

### Infrastructure

- ✅ Automatic topic creation
- ✅ Dead Letter Topic setup
- ✅ Admin client for management
- ✅ Health checks
- ✅ Comprehensive logging

## Usage

### Importing

```typescript
import { KafkaClient, initializeKafka } from './app/kafka';
```

### Publishing Messages

```typescript
// Simple publish
await KafkaClient.publishToTopic('my_topic', {
  userId: '123',
  action: 'purchase',
  amount: 100,
});

// Publish with partition key (for ordering)
await KafkaClient.publishToTopic('my_topic', messageData, 'user-123');
```

### Consuming Messages

```typescript
await KafkaClient.consumeFromTopic(
  'my_topic', // Topic name
  'my-consumer-group', // Consumer group ID
  async (data) => {
    // Message handler
    // Validate
    const validated = schema.parse(data);

    // Process
    await processMessage(validated);
  },
);
```

### Initialization

```typescript
// In your application startup
await initializeKafka();
```

## Configuration

### Environment Variables

```bash
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=zaaz-server
```

### Config Object

```typescript
import config from '../config';

config.kafka_enabled; // boolean
config.kafka_brokers; // string (comma-separated)
config.kafka_client_id; // string
```

## Error Handling

### Consumer Error Handling

```typescript
try {
  const validated = schema.parse(data);
  await processMessage(validated);
} catch (error: any) {
  // Drop message for validation errors
  if (
    error.name === 'ValidationError' ||
    error.name === 'ZodError' ||
    error.code === 11000
  ) {
    console.warn('Dropping message to avoid infinite loop');
    return;
  }

  // Re-throw for other errors (will send to DLT)
  throw error;
}
```

### Dead Letter Topics (DLT)

Failed messages are automatically sent to Dead Letter Topics:

- Original topic: `my_topic`
- Dead Letter Topic: `my_topic_dlt`

DLT messages include headers:

- `original-topic`: The original topic name
- `failed-at`: ISO timestamp of failure

## Logging

All operations are logged with emoji prefixes:

```
📨 Connection events
📤 Published messages
📥 Consumed messages
✅ Success operations
❌ Errors
⚠️ Warnings
📮 Dead Letter Topic operations
```

## Architecture

### Class: KafkaService

#### Properties

- `kafka: Kafka | null` - Kafka client instance
- `producer: Producer | null` - Producer instance
- `admin: Admin | null` - Admin client
- `consumers: Map<string, Consumer>` - Active consumers
- `messageHandlers: Map<string, Function>` - Message handlers

#### Methods

##### `connect(): Promise<void>`

Connects to Kafka brokers and initializes producer/admin clients.

##### `disconnect(): Promise<void>`

Gracefully disconnects all consumers, producer, and admin client.

##### `publishToTopic(topic: string, message: any, key?: string): Promise<void>`

Publishes a message to a topic with optional partition key.

##### `consumeFromTopic(topic: string, groupId: string, onMessage: Function): Promise<void>`

Sets up a consumer for a topic with a specific consumer group.

##### `ensureDeadLetterTopic(topic: string): Promise<void>`

Creates Dead Letter Topic if it doesn't exist.

##### `sendToDeadLetterTopic(originalTopic: string, messageValue: string): Promise<void>`

Sends failed message to Dead Letter Topic.

## Reconnection Strategy

The service uses exponential backoff for reconnection:

- Initial delay: 1000ms
- Max delay: 30000ms
- Multiplier: 2
- Retries: 8

## Consumer Groups

Consumer groups enable:

- **Parallel processing**: Multiple consumers in same group
- **Load balancing**: Messages distributed across consumers
- **Fault tolerance**: Automatic rebalancing on failure

Example:

```typescript
// Consumer 1
await KafkaClient.consumeFromTopic('orders', 'order-processors', handler);

// Consumer 2 (same group)
await KafkaClient.consumeFromTopic('orders', 'order-processors', handler);
```

## Best Practices

### 1. Topic Naming

Use descriptive, lowercase names with underscores:

```
feature_usage_topic
credits_process_end_topic
user_registration_topic
```

### 2. Consumer Group Naming

Include service name and topic:

```
zaaz-server-feature-usage-group
zaaz-server-credits-process-group
```

### 3. Message Keys

Use keys for ordering:

```typescript
// All messages for user-123 go to same partition
await KafkaClient.publishToTopic('events', data, `user-${userId}`);
```

### 4. Error Handling

- Validation errors: Drop (return)
- Transient errors: Re-throw (DLT)
- Business errors: Handle appropriately

### 5. Message Validation

Always validate with Zod:

```typescript
const schema = z.object({
  userId: z.string(),
  action: z.string(),
});

const validated = schema.parse(data);
```

## Monitoring

### Logs

Monitor application logs for:

- Connection status
- Message flow
- Errors and warnings
- DLT operations

### Kafka UI

Use Kafka UI (http://localhost:8080) to:

- View topics and messages
- Monitor consumer groups
- Check partition distribution
- Debug message flow

### Metrics

Monitor:

- Consumer lag
- Message throughput
- Error rate
- DLT message count

## Troubleshooting

### Connection Issues

1. Check `KAFKA_ENABLED=true`
2. Verify `KAFKA_BROKERS` is correct
3. Ensure Kafka is running
4. Check network connectivity

### Messages Not Consumed

1. Verify consumer is registered
2. Check consumer group ID
3. Verify topic exists
4. Check consumer logs

### DLT Issues

1. Check admin client is connected
2. Verify DLT naming
3. Check Kafka logs

## Related Files

### Consumers

- `src/app/modules/feature-usage-log/feature-usage-log.kafka-consumer.ts`
- `src/app/modules/credits-process/credits-process.kafka-consumer.ts`

### Configuration

- `src/app/config/index.ts`
- `.env`

### Documentation

- `documents/KAFKA_CONFIGURATION.md`
- `documents/KAFKA_QUICK_START.md`
- `documents/MESSAGE_BROKER_COMPARISON.md`

## Resources

- [KafkaJS Documentation](https://kafka.js.org/)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Full Configuration Guide](../../documents/KAFKA_CONFIGURATION.md)
- [Quick Start Guide](../../documents/KAFKA_QUICK_START.md)

---

**Last Updated**: 2026-02-16
