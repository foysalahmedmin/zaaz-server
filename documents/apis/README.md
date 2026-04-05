# API Documentation Index

This directory serves as the primary technical documentation for the ZaaZ project's RESTful APIs. It is organized by functional modules to ensure ease of navigation for both frontend developers and external integrators.

---

## 📂 Directory Structure

Each module has its own documentation file named `[module-name].md`:

-   **[Auth Module](auth_apis/auth.md)**: Authentication, Social Login, and Postman Collection.
-   **[User Module](user_apis/user.md)**: Profile management, Administrative controls, and Postman Collection.
-   **[catalog.md](catalog.md)**: AI models, prompt libraries, and categorization.
-   **[payment.md](payment.md)**: Package subscriptions and wallet transactions.

---

## 🛠️ API Standards

1.  **Base URL:** `{{api_url}}/api/v1`
2.  **Versioning:** All endpoints are prefixed with `/v1`.
3.  **Authentication:** Bearer token must be included in the `Authorization` header for protected routes.
4.  **Response Format:**
    ```json
    {
      "success": true,
      "message": "Dynamic success message",
      "data": { ... },
      "meta": { "total": 0, "page": 1, "limit": 10 }
    }
    ```
5.  **Error Handling:** Standardized HTTP status codes (400, 401, 403, 404, 500) with descriptive error messages.
