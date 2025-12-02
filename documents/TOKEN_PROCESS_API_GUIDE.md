# Token Process API Guide

একটি সহজ গাইড যা Token Process API ব্যবহার করার জন্য প্রয়োজনীয় সব তথ্য দেয়।

---

## 📋 Table of Contents

- [Overview](#overview)
- [Environment Setup](#environment-setup)
- [API Endpoints](#api-endpoints)
  - [Start Token Process](#start-token-process)
  - [End Token Process](#end-token-process)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)

---

## 🎯 Overview

Token Process API দুইটি endpoint দেয়:

1. **Start API** - User-এর token balance এবং feature access check করে
2. **End API** - Service execution-এর পর token deduct করে

### Basic Flow

```
1. Start API → Token check & feature validation
2. Execute Service → আপনার service logic run করুন
3. End API → Token deduct করুন (input_token, output_token দিয়ে)
```

---

## ⚙️ Environment Setup

`.env` file-এ এই environment variables add করুন:

```env
TOKEN_SERVER_URL=http://localhost:5000
SERVER_API_KEY=your-server-api-key-here
```

---

## 📡 API Endpoints

### Start Token Process

**Endpoint**: `POST /api/token-process/start`

**Headers**:

```
x-server-api-key: <SERVER_API_KEY>
Content-Type: application/json
```

**Request Body**:

```typescript
{
  user_id: string; // User ID
  feature_endpoint_id: string; // Feature endpoint ID
}
```

**Response**:

```typescript
{
  success: boolean;
  message: string;
  data: {
    user_id: string;
    token: number;              // Current token balance
    status: 'accessible' | 'not-accessible';
    message?: string;
  };
}
```

**Example**:

```typescript
const response = await axios.post(
  `${TOKEN_SERVER_URL}/api/token-process/start`,
  {
    user_id: 'user-123',
    feature_endpoint_id: 'feature-endpoint-456',
  },
  {
    headers: {
      'x-server-api-key': SERVER_API_KEY,
      'Content-Type': 'application/json',
    },
  },
);

if (response.data.data.status !== 'accessible') {
  throw new Error('Insufficient tokens');
}
```

---

### End Token Process

**Endpoint**: `POST /api/token-process/end`

**Headers**:

```
x-server-api-key: <SERVER_API_KEY>
Content-Type: application/json
```

**Request Body**:

```typescript
{
  user_id: string;              // User ID
  feature_endpoint_id: string;  // Feature endpoint ID
  input_token: number;           // Input tokens used
  output_token: number;          // Output tokens generated
  model?: string;                // Optional: Model name (e.g., 'gemini-pro')
}
```

**Response**:

```typescript
{
  success: boolean;
  message: string;
  data: {
    user_id: string;
    token: number;              // Updated token balance
    cost: number;               // Final cost (after profit calculation)
    status: 'returnable' | 'not-returnable';
    message?: string;
  };
}
```

**Example**:

```typescript
const response = await axios.post(
  `${TOKEN_SERVER_URL}/api/token-process/end`,
  {
    user_id: 'user-123',
    feature_endpoint_id: 'feature-endpoint-456',
    input_token: 100,
    output_token: 400,
    model: 'gemini-pro', // Optional
  },
  {
    headers: {
      'x-server-api-key': SERVER_API_KEY,
      'Content-Type': 'application/json',
    },
  },
);
```

**Note**:

- `input_token` এবং `output_token` দিয়ে server automatically final cost calculate করে
- Token ratio: `1:4` (1 input token = 4 output tokens)
- Profit percentage automatically add হয়

---

## 💻 Usage Examples

### Example 1: Basic Usage

```typescript
import axios from 'axios';

const TOKEN_SERVER_URL = process.env.TOKEN_SERVER_URL!;
const SERVER_API_KEY = process.env.SERVER_API_KEY!;

async function processService(user_id: string, feature_endpoint_id: string) {
  // 1. Start - Token check
  const startResponse = await axios.post(
    `${TOKEN_SERVER_URL}/api/token-process/start`,
    { user_id, feature_endpoint_id },
    {
      headers: {
        'x-server-api-key': SERVER_API_KEY,
        'Content-Type': 'application/json',
      },
    },
  );

  if (startResponse.data.data.status !== 'accessible') {
    throw new Error('Insufficient tokens');
  }

  // 2. Execute your service
  const result = await yourServiceFunction();

  // 3. End - Deduct tokens
  if (result.input_token > 0 || result.output_token > 0) {
    await axios.post(
      `${TOKEN_SERVER_URL}/api/token-process/end`,
      {
        user_id,
        feature_endpoint_id,
        input_token: result.input_token || 0,
        output_token: result.output_token || 0,
        ...(result.model && { model: result.model }),
      },
      {
        headers: {
          'x-server-api-key': SERVER_API_KEY,
          'Content-Type': 'application/json',
        },
      },
    );
  }

  return result;
}
```

---

### Example 2: Using Service Functions

```typescript
import {
  tokenProcessStart,
  tokenProcessEnd,
} from './token-process/token-process.service';

async function generateContent(user_id: string, feature_endpoint_id: string) {
  // 1. Start
  const startResult = await tokenProcessStart({
    user_id,
    feature_endpoint_id,
  });

  if (startResult.data.status !== 'accessible') {
    throw new Error(`Insufficient tokens: ${startResult.data.token}`);
  }

  // 2. Generate content
  const generated = await aiService.generate(prompt);
  const inputToken = calculateInputTokens(prompt);
  const outputToken = calculateOutputTokens(generated);

  // 3. End
  if (inputToken > 0 || outputToken > 0) {
    await tokenProcessEnd({
      user_id,
      feature_endpoint_id,
      input_token: inputToken,
      output_token: outputToken,
      model: 'gemini-pro',
    });
  }

  return generated;
}
```

---

### Example 3: Using withTokenProcess Wrapper

```typescript
import { withTokenProcess } from './utils/withTokenProcess';

// Your service function
const generateText = async (data: {
  user_id: string;
  prompt: string;
}): Promise<{
  text: string;
  input_token: number;
  output_token: number;
  model?: string;
}> => {
  const text = await aiService.generate(data.prompt);
  const inputToken = calculateTokens(data.prompt);
  const outputToken = calculateTokens(text);

  return {
    text,
    input_token: inputToken,
    output_token: outputToken,
    model: 'gemini-pro',
  };
};

// Wrap with token process
const wrappedGenerate = withTokenProcess(
  {
    feature_endpoint_id: 'text-generation-endpoint-id',
    user_id: (args) => args[0].user_id,
  },
  generateText,
);

// Use
const result = await wrappedGenerate({
  user_id: 'user-123',
  prompt: 'Hello, world!',
});
```

---

## ⚠️ Error Handling

### Common Errors

#### 1. Invalid API Key

```typescript
// Response
{
  success: false,
  status: 401,
  message: "Invalid server API key"
}
```

**Solution**: Check `SERVER_API_KEY` in `.env` file

---

#### 2. Insufficient Tokens

```typescript
// Start Response
{
  success: true,
  data: {
    status: 'not-accessible',
    token: 50  // Current balance
  }
}
```

**Solution**: Check token balance before proceeding

---

#### 3. Feature Not Available

```typescript
// Start Response
{
  success: true,
  data: {
    status: 'not-accessible',
    message: 'Feature endpoint is not available in your package'
  }
}
```

**Solution**: Verify user's package includes the feature

---

### Error Handling Example

```typescript
try {
  // Start
  const startResult = await tokenProcessStart({
    user_id,
    feature_endpoint_id,
  });

  if (startResult.data.status !== 'accessible') {
    throw new Error(
      `Access denied: ${startResult.data.message || 'Insufficient tokens'}`,
    );
  }

  // Execute service
  const result = await yourService();

  // End (with error handling)
  if (result.input_token > 0 || result.output_token > 0) {
    try {
      await tokenProcessEnd({
        user_id,
        feature_endpoint_id,
        input_token: result.input_token || 0,
        output_token: result.output_token || 0,
        model: result.model,
      });
    } catch (error) {
      // Log but don't block - user already got service
      console.error('Token deduction failed:', error);
    }
  }

  return result;
} catch (error) {
  console.error('Token process error:', error);
  throw error;
}
```

---

## 📝 Important Notes

1. **Token Calculation**:
   - Server automatically calculates final cost from `output_token` using ratio `1:4`
   - Profit percentage is automatically added

2. **Model Field**:
   - Optional field
   - Use for tracking which model was used (e.g., 'gemini-pro', 'gpt-4')

3. **Always Check Status**:
   - Always check `status === 'accessible'` before executing service

4. **End API is Optional**:
   - Only call End API if `input_token > 0` or `output_token > 0`
   - If both are 0, skip the End API call

5. **Error Handling**:
   - End API errors should not block service result
   - Log errors but allow service to complete

---

## 🔗 Related Files

- Service Functions: `src/app/token-process/token-process.service.ts`
- Types: `src/app/token-process/token-process.type.ts`
- Wrapper: `src/app/utils/withTokenProcess.ts`

---

**Last Updated**: 2025-01-22

**Version**: 2.0.0
