# User API Documentation

## 1. Profile Management

---

### **Get Current User**
- **Endpoint:** `/users/me` (Alias) or `/users/:id`
- **Method:** `GET`
- **Protected:** Yes
- **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": {
        "_id": "65b...",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "role": "user",
        "is_verified": true,
        "token_version": 1
      }
    }
    ```

---

### **Update Profile (Self)**
- **Endpoint:** `/users/update-self`
- **Method:** `PATCH`
- **Protected:** Yes
- **Payload:**
    ```json
    {
      "name": "Jane New Name",
      "image": "profile_image_url"
    }
    ```
- **Action:** Increments `token_version` to refresh session context in the frontend.

---

## 2. Admin Controls

---

### **List All Users**
- **Endpoint:** `/users`
- **Method:** `GET`
- **Protected:** Yes (Admin/Super-Admin)
- **Query Params:** `page`, `limit`, `role`, `status`, `name` (filter)
- **Response (200 OK):**
    ```json
    {
      "success": true,
      "data": [...],
      "meta": { "total": 100, "page": 1, "limit": 10 }
    }
    ```

---

### **Update User (Admin Only)**
- **Endpoint:** `/users/update-user/:id`
- **Method:** `PATCH`
- **Protected:** Yes (Admin/Super-Admin)
- **Payload:**
    ```json
    {
      "role": "editor",
      "status": "blocked"
    }
    ```
- **Action:** Triggers automatic session invalidation via `token_version` increment.

---

### **Soft Delete User**
- **Endpoint:** `/users/delete-user/:id`
- **Method:** `DELETE`
- **Protected:** Yes (Admin/Super-Admin)
