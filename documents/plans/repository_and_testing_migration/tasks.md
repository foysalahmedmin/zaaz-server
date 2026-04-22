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
- [x] Create `coupon.repository.ts`.
- [x] Refactor `coupon.service.ts`.
- [x] Implement & Verify Tests.
- [x] **GIT COMMIT** ✅

---

## 💎 Phase 3: Credits & AI Models

### 🤖 AI Model Module
- [x] Create `ai-model.repository.ts`.
- [x] Refactor `ai-model.service.ts`.
- [x] Implement & Verify Tests.
- [x] **GIT COMMIT** ✅

### 📊 Credits Usage Module
- [x] Create `credits-usage.repository.ts`.
- [x] Refactor `credits-usage.service.ts`.
- [x] Implement & Verify Tests.
- [x] **GIT COMMIT** ✅

### 💰 Credits Profit Module
- [x] Create `credits-profit.repository.ts`.
- [x] Refactor `credits-profit.service.ts`.
- [x] Implement & Verify Tests (`npm test src/modules/credits-profit`).
- [x] **GIT COMMIT** ✅

### 🔄 Credits Transaction Module
- [x] Create `credits-transaction.repository.ts`.
- [x] Refactor `credits-transaction.service.ts`.
- [x] Implement & Verify Tests (`npm test src/modules/credits-transaction`).
- [x] **GIT COMMIT** ✅

### ⚙️ Billing Setting Module
- [x] Create `billing-setting.repository.ts`.
- [x] Refactor `billing-setting.service.ts`.
- [x] Implement & Verify Tests (`npm test src/modules/billing-setting`).
- [x] **GIT COMMIT** ✅

> **Note:** `credits-process` module skipped — it is a pure orchestration service (no own Mongoose model) that delegates all DB access to other repositories.

---

## 🔔 Phase 4: Support & Cleanup

### 🔔 Notification Module
- [x] Create `notification.repository.ts`.
- [x] Refactor `notification.service.ts`.
- [x] Implement & Verify Tests (`npm test src/modules/notification`).
- [x] **GIT COMMIT** ✅

### 📬 Contact Module
- [x] Create `contact.repository.ts`.
- [x] Refactor `contact.service.ts`.
- [x] Implement & Verify Tests (`npm test src/modules/contact`).
- [x] **GIT COMMIT** ✅

### 💬 Feature Feedback Module
- [x] Create `feature-feedback.repository.ts`.
- [x] Refactor `feature-feedback.service.ts`.
- [x] Implement & Verify Tests (`npm test src/modules/feature-feedback`).
- [x] **GIT COMMIT** ✅

### 🧹 Final Audit
- [x] All 33 test suites pass (103 tests total).
- [x] Pre-existing route URL bug in `credits-usage.route.spec.ts` fixed.
