# Auth API Documentation

## 1. Authentication Endpoints

---

### **Sign In**
- **Endpoint:** `/auth/signin`
- **Method:** `POST`
- **Protected:** No
- **Payload:**
    ```json
    {
      "email": "user@example.com",
      "password": "securepassword123"
    }
    ```
- **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "User is signed in successfully!",
      "data": {
        "token": "access_jwt_token",
        "info": { ...user_details }
      }
    }
    ```

---

### **Logout From All Devices**
- **Endpoint:** `/auth/logout-all`
- **Method:** `POST`
- **Protected:** Yes (Any role)
- **Action:** Increments `token_version` to invalidate all active JWTs.
- **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Logged out from all devices successfully!",
      "data": { "token_version": 2 }
    }
    ```

---

### **Refresh Token**
- **Endpoint:** `/auth/refresh-token`
- **Method:** `POST`
- **Protected:** Cookies (Requires `refresh_token` cookie)
- **Response (200 OK):**
    ```json
    {
      "success": true,
      "message": "Access token is retrieved successfully!",
      "data": {
        "token": "new_access_jwt_token"
      }
    }
    ```

---

### **Google Sign In**
- **Endpoint:** `/auth/google-signin`
- **Method:** `POST`
- **Payload:**
    ```json
    { "id_token": "google_oauth_token" }
    ```

---

## 2. Password Management

---

### **Change Password**
- **Endpoint:** `/auth/change-password`
- **Method:** `PATCH`
- **Protected:** Yes
- **Payload:**
    ```json
    {
      "current_password": "oldpassword123",
      "new_password": "newsecurepassword456"
    }
    ```

---

### **Forget Password**
- **Endpoint:** `/auth/forget-password`
- **Method:** `POST`
- **Payload:**
    ```json
    { "email": "user@example.com" }
    ```
