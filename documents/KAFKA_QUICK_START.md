# Kafka Quick Start Guide

This guide will help you quickly set up and test Kafka in the zaaz-server project.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and pnpm installed
- zaaz-server project set up

## Step 1: Start Kafka

Start Kafka and Zookeeper using Docker Compose:

```bash
pnpm kafka:up
```

This will start:

- **Zookeeper** on port `2181`
- **Kafka** on port `9092`
- **Kafka UI** on port `8080` (for monitoring)

Verify Kafka is running:

```bash
pnpm kafka:logs
```

You should see logs indicating Kafka is ready.

## Step 2: Configure Environment

Update your `.env` file:

```bash
# Enable Kafka
KAFKA_ENABLED=true

# Kafka broker address (default for local development)
KAFKA_BROKERS=localhost:9092

# Client ID (can be customized)
KAFKA_CLIENT_ID=zaaz-server
```

## Step 3: Start the Server

Start the development server:

```bash
pnpm start:dev
```

You should see logs like:

```
📨 Attempting to connect to Kafka brokers: localhost:9092...
✅ Kafka Producer connected
✅ Kafka Admin connected
✅ Kafka Infrastructure verified
📥 Waiting for messages in topic 'feature_usage_topic'...
📥 Waiting for messages in topic 'credits_process_end_topic'...
```

## Step 4: Test Message Publishing

### Option 1: Using Kafka UI

1. Open http://localhost:8080 in your browser
2. Navigate to **Topics**
3. Create a test topic or view existing topics
4. Publish a test message
5. View consumer groups and messages

### Option 2: Using Code

Create a test endpoint or use existing functionality that publishes to Kafka:

```typescript
import { KafkaClient } from './app/kafka';

// Publish a test message
await KafkaClient.publishToTopic('test_topic', {
  message: 'Hello Kafka!',
  timestamp: new Date().toISOString(),
});
```

## Step 5: Monitor Messages

### View Kafka Logs

```bash
pnpm kafka:logs
```

### View Application Logs

Watch for messages in your application console:

```
📤 Message published to topic 'test_topic'
📥 Waiting for messages in topic 'test_topic'...
✅ Message processed from topic 'test_topic' (Partition: 0, Offset: 0)
```

### Use Kafka UI

Visit http://localhost:8080 to:

- View topics and their messages
- Monitor consumer groups
- Check partition distribution
- View message details

## Step 6: Test Error Handling

### Test Dead Letter Topic (DLT)

1. Publish an invalid message (e.g., missing required fields)
2. The consumer will fail to process it
3. The message will be sent to the Dead Letter Topic
4. Check `{topic_name}_dlt` in Kafka UI

Example:

```typescript
// This will fail validation and go to DLT
await KafkaClient.publishToTopic('feature_usage_topic', {
  invalid: 'data',
});
```

Check logs:

```
❌ Error processing message in topic 'feature_usage_topic'
📮 Message sent to Dead Letter Topic 'feature_usage_topic_dlt'
```

## Common Commands

### Kafka Management

```bash
# Start Kafka
pnpm kafka:up

# Stop Kafka
pnpm kafka:down

# View Kafka logs
pnpm kafka:logs

# Restart Kafka
pnpm kafka:restart
```

### Application

```bash
# Start development server
pnpm start:dev

# Build project
pnpm build

# Start production server
pnpm start
```

## Troubleshooting

### Kafka won't start

**Issue**: Docker containers fail to start

**Solution**:

```bash
# Stop all containers
pnpm kafka:down

# Remove volumes
docker volume prune

# Start again
pnpm kafka:up
```

### Can't connect to Kafka

**Issue**: Application shows connection errors

**Solution**:

1. Verify Kafka is running: `docker ps`
2. Check `KAFKA_ENABLED=true` in `.env`
3. Verify `KAFKA_BROKERS=localhost:9092`
4. Check Kafka logs: `pnpm kafka:logs`

### Messages not being consumed

**Issue**: Messages published but not consumed

**Solution**:

1. Check consumer is registered in `initializeKafka()`
2. Verify topic name matches between producer and consumer
3. Check consumer group ID is correct
4. View consumer groups in Kafka UI

### Port already in use

**Issue**: Port 9092 or 8080 already in use

**Solution**:

```bash
# Find process using port
netstat -ano | findstr :9092

# Kill the process or change port in docker-compose.kafka.yml
```

## Testing Scenarios

### Scenario 1: Feature Usage Logging

```typescript
import { sendFeatureUsageLog } from './app/modules/feature-usage-log/feature-usage-log.kafka-consumer';

// Publish feature usage
await sendFeatureUsageLog({
  feature_endpoint: 'endpoint-id',
  user: 'user-id',
  email: 'test@example.com',
  endpoint: '/api/test',
  method: 'POST',
  status: 'success',
  code: 200,
});
```

Expected logs:

```
📤 Message published to topic 'feature_usage_topic'
✅ Message processed from topic 'feature_usage_topic'
```

### Scenario 2: Credits Processing

```typescript
import { sendCreditsProcessEnd } from './app/modules/credits-process/credits-process.kafka-consumer';

// Process credits
await sendCreditsProcessEnd({
  user: 'user-id',
  email: 'test@example.com',
  credits: 100,
  // ... other fields
});
```

Expected logs:

```
📤 Message published to topic 'credits_process_end_topic'
✅ Message processed from topic 'credits_process_end_topic'
```

## Next Steps

1. **Read the full documentation**: See `documents/KAFKA_CONFIGURATION.md`
2. **Implement custom consumers**: Create new Kafka consumers for your use cases
3. **Configure production**: Set up Kafka cluster for production
4. **Monitor performance**: Use Kafka UI and application logs
5. **Optimize settings**: Tune Kafka configuration based on your needs

## Production Deployment

For production deployment:

1. **Use managed Kafka**: Consider Confluent Cloud, AWS MSK, or Azure Event Hubs
2. **Update brokers**: Set `KAFKA_BROKERS` to production broker addresses
3. **Enable security**: Configure SSL/TLS and SASL authentication
4. **Set replication**: Configure topic replication factor ≥ 3
5. **Monitor**: Set up monitoring with Prometheus/Grafana

Example production `.env`:

```bash
KAFKA_ENABLED=true
KAFKA_BROKERS=broker1.prod.example.com:9092,broker2.prod.example.com:9092,broker3.prod.example.com:9092
KAFKA_CLIENT_ID=zaaz-server-prod
```

## Resources

- [Full Kafka Configuration Guide](./KAFKA_CONFIGURATION.md)
- [KafkaJS Documentation](https://kafka.js.org/)
- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Kafka UI GitHub](https://github.com/provectus/kafka-ui)

---

**Need Help?** Check the troubleshooting section or refer to the full documentation.
