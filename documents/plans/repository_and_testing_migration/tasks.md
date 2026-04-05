# Architectural Migration Tasks: Repository & Testing Roadmap

**Crucial Workflow:** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ➔ `GIT COMMIT` ✅

---

## 🛠️ Phase 1: Core Infrastructure (High Priority)

### 👤 User Module
**Migration Flow:** `user.repository.ts` ➔ `user.service.ts` (Refactor) ➔ `tests` ➔ `VERIFY` ➔ `GIT COMMIT` ✅
- [ ] Create `user.repository.ts` with standard CRUD (Model interaction).
- [ ] Refactor `user.service.ts` to call `UserRepository`.
- [ ] Implement `user.service.spec.ts` (Unit Tests) mocking repository.
- [ ] Implement `user.route.spec.ts` (Integration Tests).
- [ ] **Run & Verify Tests** (`npm test src/modules/user`).
- [ ] **Mark Task & GIT COMMIT** (Confirm success before moving next).

### 🔑 Auth Module
**Migration Flow:** `auth.repository.ts` ➔ `auth.service.ts` (Refactor) ➔ `tests` ➔ `VERIFY` ➔ `GIT COMMIT` ✅
- [ ] Create `auth.repository.ts`.
- [ ] Refactor `auth.service.ts` and token logic.
- [ ] Implement service and route tests.
- [ ] **Run & Verify Tests** (`npm test src/modules/auth`).
- [ ] **Mark Task & GIT COMMIT** (Confirm success before moving next).

### 💳 Payment Modules
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ➔ `GIT COMMIT` ✅
- [ ] `payment-method` (Repository + Service Refactor + Tests).
- [ ] `payment-transaction` (Repository + Service Refactor + Tests).
- [ ] **Verify & GIT COMMIT** (one by one).

### 📁 File Module (Review)
**Migration Flow:** `audit` ➔ `tests` ➔ `VERIFY` ✅
- [ ] Audit existing `file.repository.ts`.
- [ ] Add missing tests in `src/modules/file/__tests__`.

---

## ⚙️ Phase 2: Packages, Plans & Coupons

### 📦 Package Management
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ➔ `GIT COMMIT` ✅
- [ ] `package`, `package-plan`, `package-feature`, `package-feature-config`, `package-history`, `package-transaction`.
- [ ] **Verify & GIT COMMIT** (per module).

### 🏷️ Vouchers & Pricing
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ➔ `GIT COMMIT` ✅
- [ ] `plan`, `coupon`.
- [ ] **Verify & GIT COMMIT** (per module).

---

## 🔄 Phase 3: Subscriptions, Wallets & Billing

### 💳 Subscription Lifecycle
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ➔ `GIT COMMIT` ✅
- [ ] `user-subscription`, `user-wallet`.
- [ ] **Verify & GIT COMMIT** (per module).

### 🧾 Billing & Analytics
**Migration Flow (Ea.):** `repo` ➔ `service" ➔ `tests` ➔ `VERIFY` ➔ `GIT COMMIT` ✅
- [ ] `billing-setting`, `billing-setting-history`, `dashboard`.
- [ ] **Verify & GIT COMMIT** (per module).

---

## 🤖 Phase 4: AI Models & Credit System

### 🪙 Credit Economy
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ➔ `GIT COMMIT` ✅
- [ ] `credits-process`, `credits-profit`, `credits-profit-history`, `credits-transaction`, `credits-usage`.
- [ ] **Verify & GIT COMMIT** (per module).

### 🧠 AI Engine
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ➔ `GIT COMMIT` ✅
- [ ] `ai-model`, `ai-model-history`.
- [ ] **Verify & GIT COMMIT** (per module).

---

## 📢 Phase 5: Engagement, Communication & Logs

### ✨ Features & Usage
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ➔ `GIT COMMIT` ✅
- [ ] `feature`, `feature-endpoint`, `feature-popup`, `feature-feedback`, `feature-usage-log`.
- [ ] **Verify & GIT COMMIT** (per module).

### 📨 Comms & Support
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ➔ `GIT COMMIT` ✅
- [ ] `notification`, `notification-recipient`, `contact`.
- [ ] **Verify & GIT COMMIT** (per module).

---

## 🧹 Phase 6: Infrastructure Finalization
- [ ] Standardize `AppAggregationQuery` usage in all repositories.
- [ ] Final architecture audit across all 33 modules.
- [ ] Update `project_structure.md` with final mandatory role definitions.
