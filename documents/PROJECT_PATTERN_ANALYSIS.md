# Project Pattern Analysis

## Overview

This is a **Node.js/Express.js** backend server built with **TypeScript**, using **MongoDB** (Mongoose) as the database, **Redis** for caching, and **Socket.io** for real-time communication. The project follows a **modular architecture pattern** with clear separation of concerns.

---

## Project Structure

```
src/
├── app/
│   ├── builder/          # Core utility classes (AppError, AppQuery)
│   ├── config/           # Configuration management
│   ├── errors/           # Error handlers (Zod, Validation, Cast, Duplicate)
│   ├── interface/        # TypeScript type declarations
│   ├── middlewares/      # Express middlewares (auth, validation, error, etc.)
│   ├── modules/          # Feature modules (category, contact, event)
│   ├── redis/            # Redis client setup
│   ├── routes/           # Route registration
│   ├── socket/           # Socket.io setup
│   ├── types/            # Shared type definitions
│   └── utils/            # Utility functions
├── app.ts                # Express app configuration
└── index.ts              # Application entry point
```

---

## Module Pattern (Core Architecture)

### Module Structure

Each module in `src/app/modules/` follows a **consistent file-based separation pattern**:

```
module-name/
├── module-name.route.ts      # Route definitions
├── module-name.controller.ts # Request handlers
├── module-name.service.ts    # Business logic
├── module-name.model.ts      # Mongoose schema/model
├── module-name.type.ts       # TypeScript type definitions
├── module-name.validation.ts # Zod validation schemas
└── module-name.utils.ts      # Module-specific utilities (optional)
```

### Module File Responsibilities

#### 1. **`module-name.route.ts`** - Route Layer

- Defines all HTTP routes for the module
- Applies middlewares (auth, validation, file upload)
- Maps routes to controller functions
- Uses Express Router

**Pattern:**

```typescript
import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as ModuleControllers from './module.controller';
import * as ModuleValidations from './module.validation';

const router = express.Router();

// Route definitions with middlewares
router.get('/', auth('admin'), ModuleControllers.getItems);
router.post(
  '/',
  auth('admin'),
  validation(ModuleValidations.createSchema),
  ModuleControllers.createItem,
);

export default router;
```

#### 2. **`module-name.controller.ts`** - Controller Layer

- Handles HTTP requests/responses
- Extracts data from `req` (params, query, body)
- Calls service functions
- Uses `catchAsync` wrapper for error handling
- Uses `sendResponse` utility for consistent responses

**Pattern:**

```typescript
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import * as ModuleServices from './module.service';

export const getItem = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ModuleServices.getItem(id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Item retrieved successfully',
    data: result,
  });
});
```

#### 3. **`module-name.service.ts`** - Service Layer (Business Logic)

- Contains all business logic
- Interacts with database models
- Uses `AppQuery` builder for complex queries
- Throws `AppError` for error cases
- Returns data (not HTTP responses)

**Pattern:**

```typescript
import AppError from '../../builder/AppError';
import AppQuery from '../../builder/AppQuery';
import { Model } from './module.model';
import { TType } from './module.type';

export const getItems = async (query: Record<string, unknown>) => {
  const queryBuilder = new AppQuery<TType>(Model.find(), query)
    .search(['name', 'description'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((q) => q.lean());

  return await queryBuilder.execute();
};
```

#### 4. **`module-name.model.ts`** - Data Model Layer

- Defines Mongoose schema
- Includes validation rules
- Defines virtual fields
- Implements soft delete pattern (pre hooks)
- Defines static and instance methods

**Pattern:**

```typescript
import mongoose, { Schema } from 'mongoose';
import { TDocument, TModel } from './module.type';

const schema = new Schema<TDocument>(
  {
    // Field definitions with validation
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Soft delete pre-hook
schema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TType, TType>;
  if (!query.getOptions()?.bypassDeleted) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

// Instance methods
schema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const Model = mongoose.model<TDocument, TModel>('Model', schema);
```

#### 5. **`module-name.type.ts`** - Type Definitions

- Defines TypeScript types/interfaces
- Separates document types from model types
- Exports types for use across the module

**Pattern:**

```typescript
import mongoose, { Document, Model, Types } from 'mongoose';

export type TType = {
  // Field definitions
  _id?: string;
  name: string;
  is_deleted?: boolean;
};

export interface TDocument extends TType, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TDocument | null>;
}

export type TModel = Model<TDocument> & {
  isExist(_id: string): Promise<TDocument | null>;
};
```

#### 6. **`module-name.validation.ts`** - Validation Layer

- Uses Zod for schema validation
- Defines separate schemas for different operations (create, update, etc.)
- Validates params, body, query, cookies, session

**Pattern:**

```typescript
import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const createValidationSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    // ... other fields
  }),
});

export const updateValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: z.object({
    name: z.string().min(2).optional(),
    // ... other fields
  }),
});
```

#### 7. **`module-name.utils.ts`** - Utility Functions (Optional)

- Module-specific helper functions
- Not always present (only when needed)

---

## Module Registration Pattern

Modules are registered in `src/app/routes/index.ts`:

```typescript
import express from 'express';
import ModuleRoutes from '../modules/module/module.route';

const router = express.Router();

const moduleRoutes = [
  { path: '/module', route: ModuleRoutes },
  // ... other modules
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
```

Then registered in `app.ts`:

```typescript
app.use('/api', router);
```

---

## Key Architectural Patterns

### 1. **Soft Delete Pattern**

- All models use `is_deleted: boolean` field
- Pre-hooks automatically filter deleted documents
- `bypassDeleted` option available for admin operations
- Supports restore functionality

### 2. **Query Builder Pattern (AppQuery)**

- Fluent API for building MongoDB queries
- Supports: search, filter, sort, paginate, fields
- Handles statistics queries
- Automatic soft delete filtering

### 3. **Error Handling Pattern**

- Custom `AppError` class
- Centralized error middleware
- Specific handlers for Zod, Validation, Cast, Duplicate errors
- Consistent error response format

### 4. **Authentication Pattern**

- JWT-based authentication
- Role-based access control (RBAC)
- Redis caching for user data
- Password change detection
- Guest access support

### 5. **Validation Pattern**

- Zod schemas for all inputs
- Middleware-based validation
- Validates params, query, body, cookies, session
- Automatic error formatting

### 6. **Response Pattern**

- Consistent response format via `sendResponse`
- Standard structure: `{ success, status, message, data, meta }`
- Meta includes pagination and statistics

### 7. **Async Error Handling**

- `catchAsync` wrapper for all async controllers
- Automatic error propagation to error middleware

---

## Supporting Infrastructure

### Builders

- **AppError**: Custom error class with status codes
- **AppQuery**: Fluent query builder for MongoDB

### Middlewares

- **auth.middleware**: JWT authentication & authorization
- **validation.middleware**: Zod schema validation
- **error.middleware**: Centralized error handling
- **log.middleware**: Request logging
- **not-found.middleware**: 404 handler

### Utils

- **catchAsync**: Async error wrapper
- **sendResponse**: Consistent response formatter
- **slugify**: String slugification
- **sendEmail**: Email utility
- **deleteFiles**: File cleanup utility

### Configuration

- Environment-based configuration
- Type-safe config object
- Supports development/production modes

---

## Database Patterns

### Mongoose Schema Patterns

- Timestamps: `created_at`, `updated_at`
- Soft delete: `is_deleted` field
- Virtual fields for relationships
- Pre-hooks for automatic filtering
- Instance methods (e.g., `softDelete()`)
- Static methods (e.g., `isExist()`)

### Query Patterns

- Use `AppQuery` builder for complex queries
- Support for search, filter, sort, pagination
- Field selection support
- Statistics aggregation

---

## Best Practices Observed

1. **Separation of Concerns**: Clear layer separation (route → controller → service → model)
2. **Type Safety**: Full TypeScript coverage with proper types
3. **Error Handling**: Comprehensive error handling at all layers
4. **Validation**: Input validation at route level
5. **Consistency**: Standardized patterns across all modules
6. **Scalability**: Modular structure allows easy addition of new features
7. **Security**: Authentication/authorization at route level
8. **Performance**: Redis caching, query optimization
9. **Maintainability**: Clear file naming, organized structure

---

## Module Creation Checklist

When creating a new module, follow this structure:

1. ✅ Create module directory: `src/app/modules/module-name/`
2. ✅ Create `module-name.type.ts` - Define types
3. ✅ Create `module-name.model.ts` - Define Mongoose schema
4. ✅ Create `module-name.validation.ts` - Define Zod schemas
5. ✅ Create `module-name.service.ts` - Implement business logic
6. ✅ Create `module-name.controller.ts` - Implement request handlers
7. ✅ Create `module-name.route.ts` - Define routes
8. ✅ (Optional) Create `module-name.utils.ts` - Module utilities
9. ✅ Register module in `src/app/routes/index.ts`

---

## Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose)
- **Cache**: Redis
- **Real-time**: Socket.io
- **Validation**: Zod
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Email**: Nodemailer
- **Payment**: Stripe
- **Session**: express-session with MongoDB store

---

## Notes

- The project uses **CommonJS** module system (`module: "commonjs"` in tsconfig)
- Cluster mode is supported for multi-core processing
- Graceful shutdown handling for all connections
- Docker support for development and production
- ESLint and Prettier for code quality
