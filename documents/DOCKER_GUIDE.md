# Docker Environment Guide

This guide explains the available Docker Compose configurations for the zaaz-server project.

## Available Environments

We have multiple Docker Compose configurations tailored for specific needs:

1. **Kafka Stack** (`docker-compose.kafka.yml`)
2. **RabbitMQ Stack** (`docker-compose.rabbitmq.yml`)
3. **Full Development Stack** (`docker-compose.dev.yml`)
4. **Production Stack** (`docker-compose.prod.yml`)

### 1. Kafka Stack

Use this when you only need Kafka running (e.g., when developing Kafka-related features locally).

**Services:**

- Kafka Broker (Port: 9092)
- Zookeeper (Port: 2181)
- Kafka UI (Port: 8080)
- Schema Registry (Port: 8081)
- Kafka Connect (Port: 8083)

**Commands:**

```bash
npm run kafka:up      # Start Kafka stack
npm run kafka:down    # Stop Kafka stack
npm run kafka:logs    # View logs
```

### 2. RabbitMQ Stack

Use this when you only need RabbitMQ running.

**Services:**

- RabbitMQ (Port: 5672, Mgmt: 15672)

**Commands:**

```bash
npm run rabbitmq:up   # Start RabbitMQ stack
npm run rabbitmq:down # Stop RabbitMQ stack
npm run rabbitmq:logs # View logs
```

### 3. Full Development Stack (`dev`)

A comprehensive environment containing everything needed for local development.

**Services:**

- **App**: Your Node.js application (Port: 5000, Debug: 9229)
- **Databases**: Redis (Port: 6379)
- **Message Brokers**: Kafka, Zookeeper, RabbitMQ
- **Tools**: Kafka UI, Mongo Express (Port: 8081), MailHog (Port: 8025)
- **Monitoring (Optional)**: Prometheus, Grafana

**Commands:**

```bash
npm run dev:up        # Start development stack
npm run dev:down      # Stop development stack
npm run dev:logs      # View logs
```

**Note:** Ensure you have your `.env` file configured.

### 4. Production Stack (`prod`)

Optimized configuration for production deployment.

**Services:**

- **App**: Optimized production build
- **Databases**: Redis (Persisted)
- **Message Brokers**: RabbitMQ, Kafka (Persisted)
- **Reverse Proxy**: Nginx (Optional)

**Commands:**

```bash
npm run prod:up       # Start production stack
npm run prod:down     # Stop production stack
npm run prod:logs     # View logs
```

## Quick Reference

| Command               | Description                            |
| --------------------- | -------------------------------------- |
| `npm run kafka:up`    | Start Kafka + Zookeeper + UI           |
| `npm run rabbitmq:up` | Start RabbitMQ management              |
| `npm run dev:up`      | Start EVERYTHING (App + DBs + Brokers) |
| `npm run prod:up`     | Start Production optimized stack       |

## Troubleshooting

- **Port Conflicts**: Ensure ports (5000, 5432, 6379, 9092, etc.) are free.
- **Volume Issues**: If databases fail to start, try removing volumes: `docker volume prune`.
- **Memory**: Ensure Docker has enough memory allocated (recommended: 4GB+).
