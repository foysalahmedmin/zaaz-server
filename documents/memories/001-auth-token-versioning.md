# ADR 001: Auth Token Versioning and Revocation Strategy

**Date:** 2026-04-05
**Status:** Accepted (Implemented)
**Objective:** Replace/Augment `password_changed_at` timestamp-based session revocation with a more granular and flexible `token_version` system.

---

## 1. Context
The previous system used `password_changed_at` (Timestamp) to invalidate tokens upon password changes. This had several gaps:
- **Scope:** It didn't account for role promotions/demotions or blocking users.
- **Flexibility:** It couldn't provide a "Logout from all devices" feature without changing the password.
- **Consistency:** Timestamp comparisons across different platforms (Node.js, MongoDB, Redis) can occasionally have micro-second or timezone sync issues.

## 2. Decision: Shift to `token_version`
We decided to implement a numeric versioning system:
1.  **Field:** Add `token_version` (Integer, default 1) to the User model.
2.  **Payload:** Embed `token_version` in every issued JWT.
3.  **Hooks:** Automatically increment `token_version` during:
    - Password Modification.
    - Role Change (Admin/Editor/etc.).
    - Status Change (In-progress/Blocked).
    - Manual "Logout All Devices" request.

## 3. Implementation Logic
- **DB Trigger:** Mongoose `pre-save` hook for automatic increments.
- **Service Override:** Manual `$inc: { token_version: 1 }` for bulk updates or when hooks are bypassed (`updateMany`, `findByIdAndUpdate`).
- **Middleware Check:** Real-time comparison: `decoded.token_version !== user.token_version`.

## 4. Consequences

### Positive:
- **Instant Global Logout:** One-click session invalidation.
- **Security Sync:** Privilege changes are applied immediately across all active sessions.
- **Stateless Revocation:** Maintains JWT statelessness while providing stateful revocation benefits.

### Negative/Neutral:
- **Middleware Overhead:** Requires a user fetch (or Redis check) on every authenticated request. (Mitigated by Redis caching).
- **Stale Tokens:** Previously issued tokens without `token_version` will need a one-time re-auth.
