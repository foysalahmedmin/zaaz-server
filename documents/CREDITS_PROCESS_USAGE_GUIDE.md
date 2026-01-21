# Credits Process Integration Guide

This guide provides a comprehensive framework for developers to integrate the **Credits Process** module. It ensures that credit validation, feature authorization, and usage settlement are handled with maximum financial integrity and system performance.

---

## 📋 Table of Contents

- [Credits Process Integration Guide](#credits-process-integration-guide)
  - [📋 Table of Contents](#-table-of-contents)
  - [1. Integration Overview](#1-integration-overview)
    - [Prerequisites](#prerequisites)
  - [2. The 3-Phase Lifecycle](#2-the-3-phase-lifecycle)
    - [Phase I: Authorization (Start)](#phase-i-authorization-start)
    - [Phase II: Execution](#phase-ii-execution)
    - [Phase III: Settlement (End)](#phase-iii-settlement-end)
  - [3. Implementation Methods](#3-implementation-methods)
    - [Method A: Queue-Based Settlement (Recommended)](#method-a-queue-based-settlement-recommended)
      - [1. Authorization Phase](#1-authorization-phase)
      - [2. Execution Phase](#2-execution-phase)
      - [3. Settlement Phase (Queue Publishing)](#3-settlement-phase-queue-publishing)
    - [Method B: Synchronous API Settlement](#method-b-synchronous-api-settlement)
      - [1. Authorization Phase](#1-authorization-phase-1)
      - [2. Execution Phase](#2-execution-phase-1)
      - [3. Settlement Phase](#3-settlement-phase)
  - [4. Utility Service Implementation](#4-utility-service-implementation)
    - [Usage Example (Standard Workflow)](#usage-example-standard-workflow)
  - [5. Best Practices \& Security](#5-best-practices--security)
    - [🧪 Error Handling](#-error-handling)
    - [🔑 Security](#-security)
    - [📈 Monitoring](#-monitoring)

---

## 1. Integration Overview

The Credits Process is a server-to-server protocol. Whether you are building an internal module or an external microservice, you must follow the **Authorization-Execution-Settlement** flow to ensure users never exceed their credit limits.

### Prerequisites

- **API Key**: `x-server-api-key` for authentication.
- **Base URL**: The endpoint where the Server is hosted.
- **RabbitMQ (Optional)**: Required for Method A (High-performance settlement).

---

## 2. The 3-Phase Lifecycle

Any feature consuming credits must follow these three steps:

### Phase I: Authorization (Start)

Before executing any logic (like an AI generation), you **must** call the `/start` endpoint. This verifies:

- User wallet exists.
- Sufficient "Holding Balance" (minimum credits for the feature).
- User has permissions for the requested feature.

### Phase II: Execution

The core logic of your feature (e.g., calling an LLM, generating a report). During this phase, you track telemetry data (tokens, duration, or model used).

### Phase III: Settlement (End)

After the feature completes, report the actual usage telemetry. The system calculates the final cost based on dynamic pricing (Model Cost + Profit Margin) and deducts the balance.

---

## 3. Implementation Methods

### Method A: Queue-Based Settlement (Recommended)

This is the most efficient method for production environments. It performs the settlement asynchronously via RabbitMQ, ensuring that your feature delivery is never delayed by credit processing.

#### 1. Authorization Phase

Call the `/start` endpoint to get a `usage_key`.

#### 2. Execution Phase

Run your feature logic.

#### 3. Settlement Phase (Queue Publishing)

Instead of waiting for an API response, publish the usage data to the designated RabbitMQ queue.

**Queue Names:**

- `credits_process_end_multimodel_queue`: For aggregated multi-model usage. (Recommended for all environments. Its can handle single & multi-model usage. It's for longer term usage.)
- `credits_process_end_queue`: For single-model usage. (Not recommended. Its can handle single-model usage only. It's for short term usage.)

---

### Method B: Synchronous API Settlement

Use this method for simple integrations or when you need the updated credit balance immediately in the same request cycle.

#### 1. Authorization Phase

Synchronous call to `/api/credits-process/start`.

#### 2. Execution Phase

Run your feature logic.

#### 3. Settlement Phase

Synchronous call to `/api/credits-process/end-multimodel` (Recommended) or `/api/credits-process/end` (Not recommended, its for only legacy purpose).

---

## 4. Utility Service Implementation

Below is a developer-friendly implementation of a `CreditsService` wrapper that you can adapt to any environment.

```typescript
/**
 * CreditsService.ts
 * A generic wrapper for interacting with the Credits System.
 */

const CONFIG = {
  BASE_URL: 'https://api.yoursystem.com',
  API_KEY: 'your_secret_server_api_key',
};

export class CreditsService {
  /**
   * Phase I: Authorize access to a feature
   */
  static async authorize(payload: {
    user_id: string;
    feature_endpoint_id: string;
  }) {
    const response = await fetch(
      `${CONFIG.BASE_URL}/api/credits-process/start`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-server-api-key': CONFIG.API_KEY,
        },
        body: JSON.stringify(payload),
      },
    );

    const result = await response.json();

    // Check if access is explicitly granted
    if (!result.success || result.data.status !== 'accessible') {
      throw new Error(
        result.data.message || 'Authorization failed: Insufficient Credits',
      );
    }

    return result.data; // Includes usage_key and current credits
  }

  /**
   * Phase II: Execute feature logic
   * ...
   */

  /**
   * Phase III (Method A): Publish to Queue for Asynchronous Settlement
   */
  static async settleViaQueue(
    rmqChannel: any,
    payload: {
      user_id: string;
      usage_key?: string;
      feature_endpoint_id: string;
      usages: Array<{
        ai_model: string;
        input_tokens: number;
        output_tokens: number;
      }>;
    },
  ) {
    const queueName = 'credits_process_end_multimodel_queue';

    // Ensure the payload is valid
    const message = Buffer.from(JSON.stringify(payload));

    // Publish to the queue
    return rmqChannel.sendToQueue(queueName, message, { persistent: true });
  }

  /**
   * Phase III (Method B): Direct API Settlement
   */
  static async settleViaAPI(payload: any) {
    const response = await fetch(
      `${CONFIG.BASE_URL}/api/credits-process/end-multimodel`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-server-api-key': CONFIG.API_KEY,
        },
        body: JSON.stringify(payload),
      },
    );

    return await response.json();
  }
}
```

### Usage Example (Standard Workflow)

```typescript
const runAIProcess = async (userId: string) => {
  // 1. Authorization
  const auth = await CreditsService.authorize({
    user_id: userId,
    feature_endpoint_id: 'ai_chat_v1',
  });

  // 2. Execution
  const llmResult = await callLLM('Hello, how can I help?');

  // 3. Settlement (Async via Queue)
  await CreditsService.settleViaQueue(rabbitChannel, {
    user_id: userId,
    usage_key: auth.usage_key,
    feature_endpoint_id: 'ai_chat_v1',
    usages: [
      {
        ai_model: llmResult.model,
        input_tokens: llmResult.prompt_tokens,
        output_tokens: llmResult.completion_tokens,
      },
    ],
  });
};
```

---

## 5. Best Practices & Security

### 🧪 Error Handling

- **Authorization Failures**: Treat as a hard stop. Do not proceed to call expensive AI APIs if the start phase fails.
- **Settlement Failures**: These are usually transient. If using Method B, wrap the call in a try-catch and log the error for manual reconciliation. Method A (Queue) handles this automatically via retry logic.

### 🔑 Security

- **Never expose the API Key**: The `x-server-api-key` should never be visible in browser network logs. Use it only in server-side calls.
- **Validate Input**: Always ensure the `user_id` passed is verified and matches the session context.

### 📈 Monitoring

- Use the `usage_key` to correlate your local system logs with the transaction history. This is vital for auditing.

---

**Version**: 4.0.0  
**Status**: Production Grade  
**Developer Support**: engineering-team@zaaz.com
