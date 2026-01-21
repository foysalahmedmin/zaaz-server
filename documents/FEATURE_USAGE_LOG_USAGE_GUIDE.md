# Feature Usage Log Integration Guide

The **Feature Usage Log** module is designed to capture comprehensive telemetry of every feature execution. This guide provides detailed instructions on how to implement logging using two distinct methods, with a strong focus on high-performance infrastructure.

---

## 📋 Table of Contents

- [Feature Usage Log Integration Guide](#feature-usage-log-integration-guide)
  - [📋 Table of Contents](#-table-of-contents)
  - [1. Logging Lifecycle](#1-logging-lifecycle)
  - [2. Method A: Queue-Based Settlement (⭐ Recommended)](#2-method-a-queue-based-settlement--recommended)
    - [Why use Method A?](#why-use-method-a)
    - [Implementation Setup](#implementation-setup)
  - [3. Method B: Synchronous API Settlement](#3-method-b-synchronous-api-settlement)
    - [When to use Method B?](#when-to-use-method-b)
    - [Implementation Setup](#implementation-setup-1)
  - [4. Data Schema \& Payload Details](#4-data-schema--payload-details)
  - [5. Generic Service Implementation](#5-generic-service-implementation)
  - [6. Best Practices \& Security](#6-best-practices--security)
    - [🛡️ Data Privacy (GDPR/Compliance)](#️-data-privacy-gdprcompliance)
    - [⚡ Performance](#-performance)

---

## 1. Logging Lifecycle

Usage logging acts as the "Black Box" of your application. It should capture the state of a feature request immediately before the response is sent back to the user.

1.  **Correlation**: Capture the `usage_key` from the Credits Process to link usage telemetry with financial deductions.
2.  **Context**: Record the user ID, feature endpoint, and request metadata (Payload/Query).
3.  **Result**: Record the final status code and a summary of the response.
4.  **Dispatch**: Send the data to the central logging engine via Method A or B.

---

## 2. Method A: Queue-Based Settlement (⭐ Recommended)

This is the gold standard for production environments. By using a Message Broker (RabbitMQ), you offload the logging overhead to a background process, ensuring **zero latency** for the end user.

### Why use Method A?

- **Performance**: Does not block the main execution thread.
- **Reliability**: If the logging service is temporarily down, messages stay safe in the queue.
- **Scalability**: Can handle thousands of logs per second without affecting API response times.

### Implementation Setup

- **Queue Name**: `feature_usage_queue`
- **Protocol**: AMQP (RabbitMQ)
- **Durability**: Messages should be marked as `persistent: true`.

**Execution Flow**:

1.  Complete feature logic.
2.  Format the log object.
3.  Publish the object as a JSON buffer to the `feature_usage_queue`.
4.  Return the response to the user immediately.

---

## 3. Method B: Synchronous API Settlement

This method uses direct HTTP requests to the central server. It is easier to set up for smaller integrations or environments where RabbitMQ is not available.

### When to use Method B?

- For simple debugging during development.
- In low-traffic microservices.
- Environments where installing a message broker is not feasible.

### Implementation Setup

- **Endpoint**: `POST /api/feature-usage-logs`
- **Auth Header**: `x-server-api-key: <YOUR_SERVER_API_KEY>`
- **Content-Type**: `application/json`

**Execution Flow**:

1.  Complete feature logic.
2.  Wait for the POST request to `/api/feature-usage-logs` to complete.
3.  Handle any potential HTTP errors (Retries or Logging locally).
4.  Return the response to the user.

---

## 4. Data Schema & Payload Details

The following schema is compatible with both Method A and Method B.

| Field                    | Type     | Required | Description                              |
| :----------------------- | :------- | :------- | :--------------------------------------- |
| `feature_endpoint_id`    | `string` | Yes      | MongoDB ObjectId of the feature.         |
| `feature_endpoint_value` | `string` | Yes      | The constant string slug of the feature. |
| `user_id`                | `string` | Yes      | MongoDB ObjectId of the user.            |
| `user_email`             | `string` | No       | User's email for searchable audit logs.  |
| `usage_key`              | `string` | No       | UUID from the Credits Start phase.       |
| `method`                 | `enum`   | Yes      | `GET`, `POST`, `PUT`, `DELETE`.          |
| `payload`                | `object` | No       | The full request body (JSON).            |
| `response`               | `object` | No       | Summary of the returned data.            |
| `code`                   | `number` | Yes      | HTTP Status Code (e.g., 201, 403, 500).  |
| `status`                 | `enum`   | Yes      | `'success'` or `'failed'`.               |

---

## 5. Generic Service Implementation

This implementation is designed to be copy-pasted and adapted into any developer's project structure.

```typescript
/**
 * FeatureLogger.ts - A generic logging utility
 */

const LOG_CONFIG = {
  API_URL: 'https://zaaz-payment-engine.com/api/feature-usage-logs',
  API_KEY: 'your_secure_server_key',
  RMQ_QUEUE: 'feature_usage_queue',
};

export class FeatureLogger {
  /**
   * Method A: Background Logging (Recommended)
   */
  static dispatchToQueue(amqpChannel: any, log: any) {
    try {
      const buffer = Buffer.from(JSON.stringify(log));
      return amqpChannel.sendToQueue(LOG_CONFIG.RMQ_QUEUE, buffer, {
        persistent: true,
      });
    } catch (err) {
      console.error('Failed to publish log to queue:', err);
    }
  }

  /**
   * Method B: direct API Logging
   */
  static async dispatchToAPI(log: any) {
    try {
      const response = await fetch(LOG_CONFIG.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-server-api-key': LOG_CONFIG.API_KEY,
        },
        body: JSON.stringify(log),
      });
      return await response.json();
    } catch (err) {
      console.error('Failed to send log via API:', err);
    }
  }
}
```

---

## 6. Best Practices & Security

### 🛡️ Data Privacy (GDPR/Compliance)

- **Do Not Log Secrets**: Strip out passwords, API tokens, and session cookies from the `payload` before logging.
- **Anonymization**: If possible, avoid logging PII (Personally Identifiable Information) in the `response` block.

### ⚡ Performance

- **Always use Method A in Production**: Direct API calls add overhead that can degrade user experience during peak traffic.
- **Fail Gracefully**: If the logging fails, do not crash the main feature request. The user's successful result is always more important than the log.

---

**Version**: 2.0.0  
**Status**: Production Grade  
**Platform**: ZaaZ Omni-Channel Infrastructure
