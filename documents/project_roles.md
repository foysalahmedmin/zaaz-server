# Project Development Rules and Guidelines

This document outlines the core rules and standards for developing the ZaaZ project. Adherence to these guidelines ensures scalability, maintainability, and architectural consistency.

---

## 1. Architectural Integrity

*   **Pattern:** Monolithic Modular (Feature-based separation).
*   **Encapsulation:** Keep logic related to a specific feature strictly within its own module in `src/modules/`.
*   **Shared Logic:** Only logic used by 3 or more modules should be moved to the root `src/` (utils, constants, etc.).

---

## 2. Naming & Casing Conventions

### A. Files & Directories
*   **Directories:** Always use `kebab-case` (e.g., `feature-endpoint/`).
*   **Code Files:** Use Dot Notation: `[module-name].[role].ts` (e.g., `auth.controller.ts`, `user.service.ts`). If the module name has multiple words, use `kebab-case` (e.g., `billing-setting.repository.ts`).
*   **Documentation:** Always use `snake_case` for every `.md` file (e.g., `plan_overview.md`, `tasks_list.md`).

### B. Data & Payloads
*   **Database Models:** Fields in Mongoose schemas must be `snake_case` (e.g., `is_active`, `token_version`).
*   **API Payloads:** All request bodies and response data must be `snake_case`.
*   **Query Parameters:** URL parameters must use `snake_case` (e.g., `?page_size=10`).
*   **Interfaces/Types:** Use PascalCase with a `T` prefix (e.g., `TUser`, `TPaymentPayload`).
*   **Schemas:** Zod schemas should end with `Schema` (e.g., `userValidationSchema`).

---

## 3. Communication Flow (Unidirectional)

Request flow must follow this strict hierarchy:
1.  **Route:** Entry point.
2.  **Middleware:** Security, logging, and sanity checks.
3.  **Validator:** Zod schema validation (fail fast).
4.  **Controller:** Request orchestration (no business logic here).
5.  **Service:** Core business logic and external integrations.
6.  **Builder:** Complex DB query aggregation.
7.  **Model:** Data persistence.

---

## 4. Error Handling Standards

*   **Utility:** Use `catchAsync` from `src/utils/` for every controller function to eliminate repetitive try-catch blocks.
*   **Custom Errors:** Always throw `AppError` (from `src/builder/`) to ensure standardized HTTP status codes and messages.
*   **Global Handler:** Never return error responses directly from services; propagate them to the global error middleware.

---

## 5. Database Interaction (Mongoose)

*   **Soft Deletion:** Implement `is_deleted: true` rather than physical removal for all primary entities ($SoftDelete plugin).
*   **Atomic Operations:** Use `$inc`, `$set`, and `$push` for wallet and credit logic to prevent race conditions.
*   **Aggregation:** Use `AppAggregationQuery` for complex lookups, filtering, and high-performance querying.

---

## 6. Response Standardization

*   **Consistent Payload:** All API responses must follow the standardized format:
    ```json
    {
      "success": true,
      "message": "Operation successful",
      "data": [],
      "meta": { "total": 0, "page": 1, "limit": 10 }
    }
    ```
*   **Utility:** Use the global response builder to maintain this consistency.

---

## 7. Event-Driven Side Effects

*   **Decoupling:** Primary logic (like payment settlement) should not wait for non-critical side effects (like sending emails).
*   **Messaging:** Emit events via RabbitMQ or Kafka. Allow background consumers to handle notifications and telemetry asynchronously.

---

## 8. Development Workflow

*   **Formatting:** Run `pnpm prettier:fix` before every commit.
*   **Linting:** Ensure 0 errors via `pnpm lint`.
*   **Validation:** All new endpoints must have a corresponding Zod validation schema.
*   **Commits:** Use conventional commit messages to keep the history readable.

---

## 9. Documentation & Planning Standards

For every significant feature or architectural refactor:

1.  **Strict Planning:** Create a subdirectory in `documents/plans/[feature-name]/`.
    *   `plan.md`: Archictectural overview, strategy, and reasoning.
    *   `tasks.md`: Phase-by-phase implementation checklist.
2.  **Memory Persistence:** Once a decision is finalized, record it in `documents/memories/` using the **ADR (Architectural Decision Record)** format (e.g., `002-feature-name.md`).
3.  **Source of Truth:** Ensure the `project_structure.md` and `project_specification.md` are updated upon implementation to reflect the NEW source of truth.
4.  **API Documentation:** Every new module MUST have a corresponding folder in `documents/apis/[module_name]__apis/`.
    *   `api.md`: Detailed documentation of each endpoint.
    *   `collection.json`: Modular Postman collection for THAT module only.

---

## 10. Testing Standards

*   **Convention:** Use `.spec.ts` for all test files.
*   **Placement:** Unit tests should be within a `__tests__/` folder inside the corresponding module.
*   **Integrative:** E2E and cross-module tests reside in the root `/tests/` directory.
