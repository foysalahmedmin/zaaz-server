# Tasks: Auth Token Versioning System Implementation

## Phase 1: Database and Types Update

### 1a. Update `TUser` and `TUserDocument` Interfaces
- [ ] Add `token_version: number` to `TUser` and `TUserDocument` in `src/modules/user/user.type.ts`.

### 1b. Update `User` Schema and Hooks
- [ ] Add `token_version` with `type: Number, default: 1` to `userSchema` in `src/modules/user/user.model.ts`.
- [ ] Update `pre-save` hook in `user.model.ts` to detect changes to `password`, `role`, or `status`.
- [ ] Implement version increment logic: `this.token_version = (this.token_version || 0) + 1;`.

### 1c. Update JWT Payload Interface
- [ ] Add `token_version: number` (required) to `TJwtPayload` in `src/types/jsonwebtoken.type.ts`.

---

## Phase 2: Token Generation Integration

### 2a. Update Sign-in Methods in `auth.service.ts`
- [ ] Update `signin`, `signup`, and `googleSignin` to include the user's latest `token_version` in the `jwtPayload`.

### 2b. Update `refreshToken` logic
- [ ] Ensure `refreshToken` fetches the user and verifies if the token's version is still active before issuing new ones.
- [ ] Include the current `token_version` in the new Access Token.

### 2c. Update Password/Email Tokens
- [ ] Include `token_version` in `forgetPassword` and `emailVerificationSource` payloads to prevent link re-use after a version increment.

---

## Phase 3: Service-Level Logic (Handling `findOneAndUpdate`)

### 3a. Update Password Services
- [ ] In `changePassword` (`auth.service.ts`), add `$inc: { token_version: 1 }` to the `findOneAndUpdate` update object.
- [ ] In `resetPassword` (`auth.service.ts`), add `$inc: { token_version: 1 }` to the `findByIdAndUpdate` update object.

### 3b. Update User Management Services
- [ ] In `updateUser` (`user.service.ts`), check if `role` or `status` exists in the `payload`.
- [ ] If yes, add `$inc: { token_version: 1 }` to the `findByIdAndUpdate` options to invalidate existing sessions for role/status changes.

---

## Phase 4: Middleware and Manual Revocation Implementation

### 4a. Update `auth` Middleware
- [ ] Extract `token_version` from the decoded JWT payload.
- [ ] Compare `decoded.token_version` with the latest `user.token_version` (from DB/Cache).
- [ ] Throw `403 Forbidden` if versions do not match.

### 4b. Redis Cache Management
- [ ] Update `getUser` in `auth.middleware.ts` to ensure `token_version` is retrieved and cached.
- [ ] Implement manual cache clearing (`cacheClient.del(`auth:user:${_id}`)`) in all version-incrementing operations to avoid stale check-ins.

### 4c. Implement "Logout From All Devices" Endpoint
- [ ] Add `POST /auth/logout-all` to `auth.route.ts`.
- [ ] Implement `logoutAllSessions` in `auth.service.ts` using `User.findByIdAndUpdate(id, { $inc: { token_version: 1 } })`.

---

## Phase 5: Verification and Finalization

### 5a. Functional Testing
- [ ] **Scenario A:** Change password -> Old token must fail immediately.
- [ ] **Scenario B:** Change role (Admin to User) -> Old Admin token must fail.
- [ ] **Scenario C:** Block user -> Active session must terminate.
- [ ] **Scenario D:** Call `logout-all` -> Verify all active sessions on different browsers are invalidated.

### 5b. Legacy Cleanup
- [ ] Decide on keeping `password_changed_at` for audit logs or fully migrating its logic into `token_version`.
