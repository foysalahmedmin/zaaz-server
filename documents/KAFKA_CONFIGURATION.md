# Kafka Configuration Guide

## Overview

This project uses **Apache Kafka** as a distributed message broker for asynchronous event processing. The Kafka configuration follows the same architectural pattern as RabbitMQ, ensuring consistency across the codebase.

## Features

- ✅ **Producer/Consumer Pattern**: Publish and consume messages from Kafka topics
- ✅ **Dead Letter Topics (DLT)**: Automatic handling of failed messages
- ✅ **Automatic Reconnection**: Exponential backoff retry mechanism
- ✅ **Error Handling**: Comprehensive error handling with logging
- ✅ **Idempotent Producer**: Ensures exactly-once message delivery
- ✅ **Consumer Groups**: Scalable message consumption with consumer groups
- ✅ **Topic Management**: Automatic topic creation and management

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```bash
# ---------------------------------------------------------
# 📨 Kafka Configuration
# ---------------------------------------------------------
KAFKA_ENABLED=false                    # Enable/disable Kafka
KAFKA_BROKERS=localhost:9092           # Comma-separated list of Kafka brokers
KAFKA_CLIENT_ID=zaaz-server            # Unique client identifier
```

### Config File

The configuration is automatically loaded from `src/app/config/index.ts`:

```typescript
kafka_enabled: process.env.KAFKA_ENABLED === 'true' && !!process.env.KAFKA_BROKERS,
kafka_brokers: process.env.KAFKA_BROKERS as string,
kafka_client_id: process.env.KAFKA_CLIENT_ID as string,
```

## Architecture

### Directory Structure

```
src/app/
├── kafka/
│   └── index.ts                    # Main Kafka service
├── modules/
│   ├── feature-usage-log/
│   │   └── feature-usage-log.kafka-consumer.ts
│   └── credits-process/
│       └── credits-process.kafka-consumer.ts
```

### Core Components

#### 1. KafkaService (`src/app/kafka/index.ts`)

The main Kafka service class that handles:

- Connection management
- Producer creation
- Consumer management
- Dead Letter Topic (DLT) handling
- Automatic reconnection with exponential backoff

#### 2. Consumers

Each module has its own Kafka consumer file:

- `feature-usage-log.kafka-consumer.ts`: Handles feature usage logging
- `credits-process.kafka-consumer.ts`: Handles credit processing (single and multi-model)

## Usage

### Publishing Messages

```typescript
import { KafkaClient } from '../../kafka';

// Publish a message to a topic
await KafkaClient.publishToTopic('my_topic', {
  userId: '123',
  action: 'purchase',
  amount: 100,
});

// Publish with a specific key (for partitioning)
await KafkaClient.publishToTopic('my_topic', messageData, 'user-123');
```

### Consuming Messages

```typescript
import { KafkaClient } from '../../kafka';

// Setup a consumer
await KafkaClient.consumeFromTopic(
  'my_topic', // Topic name
  'my-consumer-group', // Consumer group ID
  async (data) => {
    // Message handler
    console.log('Received:', data);
    // Process the message
  },
);
```

### Example: Feature Usage Log

```typescript
// Publisher
import { sendFeatureUsageLog } from './feature-usage-log.kafka-consumer';

await sendFeatureUsageLog({
  feature_endpoint: 'endpoint-id',
  user: 'user-id',
  email: 'user@example.com',
  // ... other fields
});

// Consumer (automatically set up during initialization)
export const setupFeatureUsageLogConsumer = async () => {
  await KafkaClient.consumeFromTopic(
    FEATURE_USAGE_TOPIC,
    FEATURE_USAGE_GROUP_ID,
    async (data) => {
      // Validate and process
      const validatedData = schema.parse(data);
      await FeatureUsageLogService.createFeatureUsageLogFromServer(
        validatedData,
      );
    },
  );
};
```

## Dead Letter Topics (DLT)

When a message fails to process, it's automatically sent to a Dead Letter Topic:

- **Original Topic**: `my_topic`
- **Dead Letter Topic**: `my_topic_dlt`

Dead Letter Topics are automatically created when a consumer is set up.

### DLT Message Headers

Failed messages in DLT include metadata:

- `original-topic`: The original topic name
- `failed-at`: ISO timestamp of when the message failed

## Error Handling

### Consumer Error Handling

Consumers should handle errors gracefully:

```typescript
try {
  // Validate data
  const validatedData = schema.parse(data);

  // Process data
  await processData(validatedData);
} catch (error: any) {
  console.error('Error processing message:', error);

  // Drop message for validation errors (avoid infinite loops)
  if (
    error.name === 'ValidationError' ||
    error.name === 'ZodError' ||
    error.code === 11000 // MongoDB duplicate key
  ) {
    console.warn('Dropping message to avoid infinite loop');
    return;
  }

  // Re-throw for other errors (will send to DLT)
  throw error;
}
```

## Initialization

Kafka is initialized in the main application startup:

```typescript
import { initializeKafka } from './app/kafka';

// During app startup
await initializeKafka();
```

This will:

1. Connect to Kafka brokers
2. Create producer and admin clients
3. Set up all registered consumers
4. Create necessary topics and DLTs

## Comparison: Kafka vs RabbitMQ

| Feature               | Kafka                             | RabbitMQ                 |
| --------------------- | --------------------------------- | ------------------------ |
| **Pattern**           | Pub/Sub with Topics               | Queue-based              |
| **Message Retention** | Configurable (default: 7 days)    | Until consumed           |
| **Ordering**          | Per-partition ordering            | Per-queue ordering       |
| **Scalability**       | Horizontal scaling via partitions | Vertical scaling         |
| **Use Case**          | Event streaming, logs             | Task queues, RPC         |
| **Dead Letter**       | Dead Letter Topics (DLT)          | Dead Letter Queues (DLQ) |

## Best Practices

### 1. Topic Naming Convention

Use descriptive, lowercase names with underscores:

```
feature_usage_topic
credits_process_end_topic
user_registration_topic
```

### 2. Consumer Group Naming

Include the service name and topic:

```
zaaz-server-feature-usage-group
zaaz-server-credits-process-group
```

### 3. Message Keys

Use message keys for:

- Ensuring related messages go to the same partition
- Maintaining order for specific entities

```typescript
// All messages for user-123 go to the same partition
await KafkaClient.publishToTopic('user_events', data, `user-${userId}`);
```

### 4. Error Handling

- **Validation Errors**: Drop the message (log and return)
- **Transient Errors**: Re-throw to retry (will eventually go to DLT)
- **Business Logic Errors**: Handle appropriately based on use case

### 5. Message Schema

Always validate messages using Zod schemas:

```typescript
const messageSchema = z.object({
  userId: z.string(),
  action: z.string(),
  timestamp: z.string(),
});

const validatedData = messageSchema.parse(data);
```

## Monitoring

### Logs

Kafka operations are logged with emoji prefixes:

- 📨 Connection events
- 📤 Published messages
- 📥 Consumed messages
- ✅ Success operations
- ❌ Errors
- ⚠️ Warnings
- 📮 Dead Letter Topic operations

### Example Logs

```
📨 Attempting to connect to Kafka brokers: localhost:9092...
✅ Kafka Producer connected
✅ Kafka Admin connected
✅ Kafka Infrastructure verified
📥 Waiting for messages in topic 'feature_usage_topic' (Group: zaaz-server-feature-usage-group)...
📤 Message published to topic 'feature_usage_topic'
✅ Message processed from topic 'feature_usage_topic' (Partition: 0, Offset: 123)
```

## Troubleshooting

### Connection Issues

If Kafka fails to connect:

1. Check `KAFKA_ENABLED=true` in `.env`
2. Verify `KAFKA_BROKERS` is correct
3. Ensure Kafka is running: `docker ps` or check Kafka service
4. Check network connectivity to brokers

### Messages Not Being Consumed

1. Verify consumer is registered in `initializeKafka()`
2. Check consumer group ID is unique
3. Verify topic exists: Use Kafka admin tools
4. Check consumer logs for errors

### Dead Letter Topic Issues

1. Check admin client is connected
2. Verify DLT naming: `{original_topic}_dlt`
3. Check Kafka logs for topic creation errors

## Running Kafka Locally

### Using Docker

```bash
# docker-compose.yml
version: '3.8'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
      ZOOKEEPER_TICK_TIME: 2000

  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
```

Start Kafka:

```bash
docker-compose up -d
```

Update `.env`:

```bash
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
```

## Migration from RabbitMQ

If you're migrating from RabbitMQ:

1. **Keep both running**: Enable both `RABBITMQ_ENABLED` and `KAFKA_ENABLED`
2. **Dual publishing**: Publish to both systems during transition
3. **Gradual migration**: Move consumers one by one
4. **Monitor**: Ensure no message loss during migration
5. **Disable RabbitMQ**: Once fully migrated, set `RABBITMQ_ENABLED=false`

## Production Considerations

### 1. Broker Configuration

For production, use multiple brokers:

```bash
KAFKA_BROKERS=broker1:9092,broker2:9092,broker3:9092
```

### 2. Replication

Configure topic replication factor ≥ 3 for high availability

### 3. Partitions

Use multiple partitions for high-throughput topics:

- More partitions = better parallelism
- Consider number of consumers in group

### 4. Monitoring

Use tools like:

- Kafka Manager
- Confluent Control Center
- Prometheus + Grafana

### 5. Security

Enable SSL/TLS and SASL authentication in production

## References

- [KafkaJS Documentation](https://kafka.js.org/)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Kafka Best Practices](https://kafka.apache.org/documentation/#bestpractices)

---

**Last Updated**: 2026-02-16
