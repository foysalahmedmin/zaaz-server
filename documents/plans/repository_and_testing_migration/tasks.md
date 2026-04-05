# Architectural Migration Tasks: Repository & Testing Roadmap

**Crucial Workflow:** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ➔ `GIT COMMIT` ✅

---

## 🛠️ Phase 1: Core Infrastructure (High Priority)

### 👤 User Module
- [x] Create `user.repository.ts`.
- [x] Refactor `user.service.ts`.
- [x] Implement & Verify Tests.
- [x] **GIT COMMIT** ✅

### 🔑 Auth Module
- [x] Create `auth.repository.ts`.
- [x] Refactor `auth.service.ts`.
- [x] Implement & Verify Tests.
- [x] **GIT COMMIT** ✅

### 💳 Payment Method Module
- [x] Create `payment-method.repository.ts`.
- [x] Refactor `payment-method.service.ts`.
- [x] Implement service and route tests.
- [x] **Run & Verify Tests** (`npm test src/modules/payment-method`).
- [x] **Mark Task & GIT COMMIT** ✅

### 💸 Payment Transaction Module
**Migration Flow:** `payment-transaction.repository.ts` ➔ `payment-transaction.service.ts` ➔ `tests` ➔ `VERIFY` ➔ `GIT COMMIT` ✅
- [x] Create `payment-transaction.repository.ts`.
- [x] Refactor `payment-transaction.service.ts`.
- [x] Implement service and route tests.
- [x] **Run & Verify Tests** (`npm test src/modules/payment-transaction`).
- [x] **Mark Task & GIT COMMIT** ✅

---

## 📦 Phase 2: Subscription & Packages
**Goal:** Migrate Package, Plan, and Subscription management.

### 🍱 Package & Plan Module
- [x] Create `package.repository.ts` and `plan.repository.ts`.
- [x] Refactor `package.service.ts` and `plan.service.ts`.
- [x] Implement & Verify Tests.
- [x] **GIT COMMIT** ✅

### 🔄 User Subscription Module
- [x] Create `user-subscription.repository.ts`.
- [x] Refactor `user-subscription.service.ts`.
- [x] Implement & Verify Tests.
- [x] **GIT COMMIT** ✅

### 🎟️ Coupon Module
- [ ] Create `coupon.repository.ts`.
- [ ] Refactor `coupon.service.ts`.
- [ ] Implement & Verify Tests.
- [ ] **GIT COMMIT** ✅

---

## 💎 Phase 3: Credits & AI Models
- [ ] Create repositories for AI model, credits models (usage, profit, process).
- [ ] Refactor services and implement tests.
- [ ] **GIT COMMIT** ✅
