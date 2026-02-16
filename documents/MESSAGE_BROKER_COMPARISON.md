# Message Broker Comparison: RabbitMQ vs Kafka

## Overview

The zaaz-server project supports **both RabbitMQ and Kafka** as message brokers, providing flexibility in choosing the right tool for different use cases. This document compares their implementations and helps you decide which to use.

## Quick Comparison

| Feature               | RabbitMQ                | Kafka                          |
| --------------------- | ----------------------- | ------------------------------ |
| **Pattern**           | Queue-based (AMQP)      | Topic-based (Pub/Sub)          |
| **Message Retention** | Until consumed          | Configurable (default: 7 days) |
| **Ordering**          | Per-queue FIFO          | Per-partition ordering         |
| **Scalability**       | Vertical (clustering)   | Horizontal (partitions)        |
| **Throughput**        | Moderate                | Very High                      |
| **Latency**           | Low (ms)                | Low-Medium (ms)                |
| **Dead Letter**       | DLQ (Dead Letter Queue) | DLT (Dead Letter Topic)        |
| **Use Case**          | Task queues, RPC        | Event streaming, logs          |
| **Complexity**        | Lower                   | Higher                         |
| **Message Replay**    | No                      | Yes (within retention)         |

## Implementation Comparison

### Configuration

#### RabbitMQ (.env)

```bash
RABBITMQ_ENABLED=true
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

#### Kafka (.env)

```bash
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=zaaz-server
```

### Publishing Messages

#### RabbitMQ

```typescript
import { RabbitMQ } from '../../rabbitmq';

await RabbitMQ.publishToQueue('my_queue', {
  userId: '123',
  action: 'purchase',
});
```

#### Kafka

```typescript
import { KafkaClient } from '../../kafka';

await KafkaClient.publishToTopic(
  'my_topic',
  {
    userId: '123',
    action: 'purchase',
  },
  'user-123',
); // Optional key for partitioning
```

### Consuming Messages

#### RabbitMQ

```typescript
await RabbitMQ.consumeFromQueue('my_queue', async (data) => {
  console.log('Received:', data);
  // Process message
});
```

#### Kafka

```typescript
await KafkaClient.consumeFromTopic(
  'my_topic',
  'my-consumer-group',
  async (data) => {
    console.log('Received:', data);
    // Process message
  },
);
```

## When to Use Each

### Use RabbitMQ When:

✅ **Task Queues**: You need reliable task distribution

- Example: Email sending, image processing
- Workers pick up tasks and process them

✅ **RPC Patterns**: Request-response communication

- Example: Microservice communication
- Direct replies to specific queues

✅ **Simple Setup**: You want quick setup and lower complexity

- Easier to understand and configure
- Good for smaller teams

✅ **Message Acknowledgment**: You need fine-grained control

- Manual ack/nack per message
- Requeue failed messages

✅ **Priority Queues**: Different priority levels needed

- High-priority tasks processed first
- Built-in priority queue support

### Use Kafka When:

✅ **Event Streaming**: You need event sourcing or CQRS

- Example: User activity tracking, audit logs
- Events stored and can be replayed

✅ **High Throughput**: Processing millions of messages

- Example: Analytics, metrics collection
- Horizontal scaling with partitions

✅ **Message Replay**: Need to reprocess historical data

- Example: Debugging, analytics recalculation
- Messages retained for configurable period

✅ **Multiple Consumers**: Same data for different purposes

- Example: One event triggers multiple actions
- Consumer groups for independent processing

✅ **Ordering Guarantees**: Strict ordering per entity

- Example: User state changes must be ordered
- Partition keys ensure order

## Use Cases in zaaz-server

### Current Implementation

Both RabbitMQ and Kafka are configured for the same use cases:

1. **Feature Usage Logging**
   - RabbitMQ: `feature_usage_queue`
   - Kafka: `feature_usage_topic`

2. **Credits Processing (Single Model)**
   - RabbitMQ: `credits_process_end_queue`
   - Kafka: `credits_process_end_topic`

3. **Credits Processing (Multi-Model)**
   - RabbitMQ: `credits_process_end_multimodel_queue`
   - Kafka: `credits_process_end_multimodel_topic`

### Recommended Usage

#### Use RabbitMQ for:

- **Payment Processing**: Reliable, exactly-once processing
- **Email Notifications**: Task queue with retries
- **Credit Transactions**: Critical financial operations

#### Use Kafka for:

- **Feature Usage Logs**: High-volume event streaming
- **Analytics Events**: Data that needs to be replayed
- **Audit Logs**: Long-term retention and compliance

## Running Both Simultaneously

You can run both message brokers at the same time:

```bash
# .env
RABBITMQ_ENABLED=true
RABBITMQ_URL=amqp://guest:guest@localhost:5672

KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=zaaz-server
```

### Benefits:

- **Flexibility**: Use the right tool for each job
- **Migration**: Gradual transition from one to another
- **Redundancy**: Backup messaging system

### Considerations:

- **Complexity**: More infrastructure to manage
- **Resources**: Both systems consume memory/CPU
- **Monitoring**: Need to monitor both systems

## Migration Strategy

### From RabbitMQ to Kafka

1. **Enable both**: Set both `ENABLED` flags to `true`
2. **Dual publishing**: Publish to both systems
3. **Test Kafka consumers**: Verify Kafka processing
4. **Switch consumers**: Move consumers one by one
5. **Monitor**: Ensure no message loss
6. **Disable RabbitMQ**: Once fully migrated

### From Kafka to RabbitMQ

Same process in reverse.

## Performance Considerations

### RabbitMQ

- **Throughput**: ~10k-50k messages/sec per queue
- **Latency**: 1-5ms
- **Memory**: Moderate (messages in RAM)
- **Disk**: Used for persistence
- **Scaling**: Add more nodes to cluster

### Kafka

- **Throughput**: ~100k-1M+ messages/sec per partition
- **Latency**: 2-10ms
- **Memory**: Low (messages on disk)
- **Disk**: Primary storage (sequential writes)
- **Scaling**: Add more partitions/brokers

## Monitoring

### RabbitMQ

- Management UI: http://localhost:15672
- Metrics: Queue depth, consumer count, message rate
- Tools: RabbitMQ Management Plugin

### Kafka

- Kafka UI: http://localhost:8080
- Metrics: Partition lag, throughput, consumer groups
- Tools: Kafka Manager, Confluent Control Center

## Cost Considerations

### Development

- **RabbitMQ**: Free (self-hosted)
- **Kafka**: Free (self-hosted)

### Production (Managed Services)

- **RabbitMQ**: CloudAMQP, AWS MQ (~$50-500/month)
- **Kafka**: Confluent Cloud, AWS MSK (~$100-1000/month)

### Self-Hosted

- **RabbitMQ**: Lower resource requirements
- **Kafka**: Higher resource requirements (Zookeeper + Kafka)

## Best Practices

### RabbitMQ

1. Use durable queues for important messages
2. Enable publisher confirms
3. Set up Dead Letter Queues (DLQ)
4. Monitor queue depth
5. Use prefetch for fair distribution

### Kafka

1. Use appropriate partition count
2. Set replication factor ≥ 3 in production
3. Use consumer groups for scaling
4. Monitor consumer lag
5. Configure retention based on needs

## Troubleshooting

### RabbitMQ Issues

- **Connection refused**: Check RabbitMQ is running
- **Messages not consumed**: Verify consumer is connected
- **Memory warnings**: Increase memory or add nodes

### Kafka Issues

- **Broker not available**: Check Kafka and Zookeeper
- **Consumer lag**: Add more consumers or partitions
- **Disk full**: Adjust retention policy

## Conclusion

### Choose RabbitMQ if:

- You need simple, reliable task queues
- Message acknowledgment is critical
- You want lower operational complexity
- Your throughput is moderate (<50k msg/sec)

### Choose Kafka if:

- You need event streaming and replay
- You have very high throughput requirements
- You need long-term message retention
- You want to scale horizontally

### Use Both if:

- Different use cases have different requirements
- You're migrating between systems
- You want redundancy and flexibility

## Resources

### RabbitMQ

- [RabbitMQ Configuration](./RABBITMQ_CONFIGURATION.md) (if exists)
- [RabbitMQ Documentation](https://www.rabbitmq.com/documentation.html)

### Kafka

- [Kafka Configuration](./KAFKA_CONFIGURATION.md)
- [Kafka Quick Start](./KAFKA_QUICK_START.md)
- [KafkaJS Documentation](https://kafka.js.org/)

---

**Last Updated**: 2026-02-16
