# Project Structure

This document presents a **fully industry-standard monolithic modular backend architecture** using **Node.js, Express, TypeScript**. It is designed to be **scalable, maintainable, and production-ready**. The structure emphasizes module separation, shared utilities, constants, validators, policies, events, builders, database models, seed files, and standardized testing conventions.

---

## 1. Root Folder Structure

```plaintext
project-root/
├─ documents/                # Project documentation
├─ infra/                    # Infrastructure & deployment config (Docker, Nginx, etc.)
├─ postman_collection/       # Postman API collections for testing
├─ public/                   # Static files for frontend distribution (Ignored)
├─ uploads/                  # Temporary and persistent file uploads (Ignored)
├─ dist/                     # Compiled JS output
├─ src/                      # Source code
├─ tests/                    # Integration/E2E tests
├─ .env                      # Environment variables
├─ .env.example              # Template for environment variables
├─ package.json
├─ tsconfig.json
├─ jest.config.js
├─ .eslintrc.js
├─ .prettierrc
└─ README.md
```

**Explanation:**

- `documents/`: Contains API specifications, architecture diagrams, and other project docs.
- `infra/`: Contains Dockerfiles, docker-compose configs, Nginx configs, and monitoring setups.
- `postman_collection/`: Exported Postman JSON files for API testing and documentation.
- `public/`: Used for compiled frontend assets or public static content.
- `uploads/`: Stores media or files uploaded via the application's APIs.
- `dist/`: Holds compiled TypeScript output.
- `tests/`: Integration or end-to-end tests.
- `.env.example`: Template for environment configuration.
- Other root files provide project configurations, linting, formatting, and TypeScript settings.

---

## 2. `src/` Folder Structure

```plaintext
src/
├─ config/                   # Configuration files
│  ├─ env.ts                 # Load environment variables
│  ├─ db.ts                  # Database connection setup
│  ├─ redis.ts               # Redis configuration
│  ├─ rabbitmq.ts            # RabbitMQ connection configuration
│  ├─ kafka.ts               # Kafka consumer/producer setup
│  ├─ socket.ts              # Socket/WebSocket setup
│  ├─ logger.ts              # Logger setup (winston/pino)
│  ├─ mail.ts                # Email service configuration
│  └─ test-config.ts         # Test-specific configuration (mock DB, etc.)
│
├─ internal-credits-process/ # High-performance internal services
├─ internal-feature-usage-log/
├─ internal-give-credits/
│
├─ providers/                # Third-party service providers (Stripe, SSLCommerz, etc.)
├─ jobs/                     # Scheduled background tasks (Cron jobs)
├─ scripts/                  # One-time or maintenance scripts (Migrations, etc.)
├─ templates/                # Static templates (Emails, Notifications, etc.)
│
├─ middlewares/              # Express middlewares
│  ├─ auth.middleware.ts     # Authentication
│  ├─ error.middleware.ts    # Error handling
│  └─ validation.middleware.ts # Request validation
│
├─ constants/                # Global constants
│  ├─ app-constants.ts       # App-wide constants
│  └─ error-codes.ts         # Standardized error codes
│
├─ validators/            # Reusable validators
│  └─ request-validator.ts
│
├─ enums/                 # Shared enums
│  └─ user-role.enum.ts
│
├─ policies/              # Shared policies (RBAC, ACL)
│  └─ rbac.policy.ts
│
├─ events/                # Shared event publishers
│  └─ event-publisher.ts
│
├─ builder/                  # Builder classes for reusability
│  ├─ response-builder.ts    # Standardized response builder
│  ├─ query-builder.ts       # Query builder for complex DB queries
│  └─ app-aggregation-query.ts # Advanced aggregation query builder
│
├─ services/                 # Shared services
│  ├─ email.service.ts
│  ├─ cache.service.ts
│  ├─ token.service.ts
│  └─ notification.service.ts
│
├─ utils/                    # Utility functions
│  ├─ logger.ts              # Logging utility
│  ├─ error-handler.ts       # Error formatting
│  └─ response-formatter.ts  # Response standardization
│
├─ types/                    # Global and API-specific TypeScript types
│  ├─ global.d.ts
│  └─ api-response.type.ts
│
├─ modules/                  # Feature-based modules
│  ├─ catalog/               # Catalog module
│  │  ├─ catalog.model.ts
│  │  ├─ catalog.controller.ts
│  │  ├─ catalog.service.ts
│  │  ├─ catalog.route.ts
│  │  ├─ catalog.repository.ts
│  │  ├─ catalog.type.ts
│  │  ├─ catalog.util.ts
│  │  ├─ catalog.validator.ts
│  │  ├─ catalog.constant.ts
│  │  ├─ catalog.enum.ts
│  │  ├─ catalog.policy.ts
│  │  ├─ catalog.event.ts
│  │  └─ __tests__/          # Unit tests for catalog module
│  │     ├─ catalog.controller.spec.ts
│  │     ├─ catalog.service.spec.ts
│  │     └─ catalog.repository.spec.ts
│  │
│  └─ user/                  # User module
│     ├─ user.model.ts
│     ├─ user.controller.ts
│     ├─ user.service.ts
│     ├─ user.route.ts
│     ├─ user.repository.ts
│     ├─ user.type.ts
│     ├─ user.util.ts
│     ├─ user.validator.ts
│     ├─ user.constant.ts
│     ├─ user.enum.ts
│     ├─ user.policy.ts
│     └─ __tests__/
│        ├─ user.controller.spec.ts
│        ├─ user.service.spec.ts
│        └─ user.repository.spec.ts
│
├─ routes.ts                 # Aggregates all module routes
├─ serverless.ts             # Vercel/Serverless entry point
├─ seed.ts                   # Database seeding
├─ app.ts                     # Express app setup
└─ index.ts                   # Entry point (Cluster mode)
```

**Detailed Explanation:**

1. **Config:** Centralized place for all environment and service configurations.
2. **Internal Modules:** Specialized services for cross-cutting concerns (e.g., credit processing, telemetry logs).
3. **Providers:** Encapsulation of third-party API integrations (Payment gateways, Analytics).
4. **Jobs:** Cron job definitions using `node-cron` or similar for scheduled tasks.
5. **Scripts:** Utility scripts for database migrations, data cleanup, or maintenance.
6. **Templates:** Email and message templates maintained separately from logic.
7. **Middlewares:** Separate authentication, validation, and error handling.
8. **Constants:** Application-wide vs module-specific constants.
9. **Utils:** Reusable utility functions used across the application.
10. **Validators:** Common validation logic shared across modules.
11. **Enums:** Global enums to maintain consistency across the system.
12. **Policies:** Authorization and access control rules.
13. **Events:** Event definitions and handlers for cross-module communication.
14. **Builder:** Patterns for creating consistent responses and queries (including `AppAggregationQuery`).
15. **Services:** Core reusable services like email, cache, token, notifications.
16. **Types:** Global types to avoid duplication.
17. **Modules:** Each feature has its own folder with models, controllers, services, routes, validators, constants, enums, policies, events, and module-level tests.
18. **Seed:** Prepopulates DB for development/testing.
19. **App & Index:** Initializes Express and starts the server (supports Serverless and Cluster mode).

---

## 3. Folder & File Naming Conventions

| Folder/File       | Naming Convention                 | Purpose                                       |
| ----------------- | --------------------------------- | --------------------------------------------- |
| Modules           | `kebab-case`                      | `catalog/`, `user/`                           |
| Module Files      | `module-name.file-type.ts`        | `catalog.controller.ts`, `catalog.service.ts` |
| Models            | `module-name.model.ts`            | DB schemas/ORM models                         |
| Module Validators | `module-name.validator.ts`        | Module-specific request validation            |
| Module Constants  | `module-name.constant.ts`         | Module-specific constants                     |
| Shared Constants  | `src/constants/*.ts`              | Application-wide constants                    |
| Shared Validators | `src/validators/*.ts`             | Reusable validators across modules            |
| Shared Enums      | `src/enums/*.ts`                  | Reusable enums                                |
| Shared Policies   | `src/policies/*.ts`               | RBAC / access control rules                   |
| Builder Classes   | `src/builder/*.ts`                | Reusable builders (query/response)            |
| Middlewares       | `src/middlewares/*.middleware.ts` | Express middleware (auth, error, validation)  |
| Utilities         | `src/utils/*.ts`                  | Generic helper functions                      |
| Tests             | `.spec.ts`                        | Jest unit & integration tests                 |

---

## 4. Testing Conventions

- **Module unit tests:** Inside module folder `__tests__/`
- **Integration tests:** Inside `tests/` folder
- **File naming:** `.spec.ts` → industry standard for Jest

**Why `.spec.ts` instead of `.test.ts`:**

- Aligns with **formal specification terminology**
- Widely used in **Jest, NestJS, Angular**
- Modern standard for TypeScript projects

---

## 5. Seed & Builder Usage

- `src/seed.ts`: Seeds initial database with default data, users, demo content.
- `src/builder/`: Contains builders for responses, queries, or objects ensuring consistent patterns across modules.

---

## ✅ Summary

- **Monolithic yet modular:** Single repo, self-contained feature modules
- **Industry-standard naming:** kebab-case folders, module-name.file-type.ts
- **Centralized shared code:** constants, enums, validators, policies, events, builders
- **Scalable & maintainable:** Easy to add new modules and utilities
- **Testing convention:** Module-level `.spec.ts` unit tests + centralized integration tests
- **Seed & builder included:** Production-ready setup

---

This structure is **modern, maintainable, and ready for large-scale TypeScript/Express backend projects**.
