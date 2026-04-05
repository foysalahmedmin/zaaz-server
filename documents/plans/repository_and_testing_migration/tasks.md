# Architectural Migration Tasks: Complete Repository & Testing Roadmap

**Goal:** Decouple ALL 33 modules by introducing the Repository Layer and implementing comprehensive tests.

---

## 🛠️ Phase 1: Core Infrastructure (High Priority)

### 👤 User Module
**Migration Flow:** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ✅
- [ ] Implement `user.repository.ts`.
- [ ] Refactor `user.service.ts` and add tests.

### 🔑 Auth Module
**Migration Flow:** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ✅
- [ ] Implement `auth.repository.ts`.
- [ ] Refactor `auth.service.ts` and add tests.

### 💳 Payment Modules
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ✅
- [ ] `payment-method` (Repository + Service Refactor + Tests).
- [ ] `payment-transaction` (Repository + Service Refactor + Tests).

### 📁 File Module (Review)
**Migration Flow:** `audit` ➔ `tests` ➔ `VERIFY` ✅
- [ ] Audit existing `file.repository.ts`.
- [ ] Add missing tests in `src/modules/file/__tests__`.

---

## ⚙️ Phase 2: Packages, Plans & Coupons

### 📦 Package Management
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ✅
- [ ] `package` (Core package logic).
- [ ] `package-plan` (Plan variations).
- [ ] `package-feature` (Feature mapping).
- [ ] `package-feature-config` (Specific configs).
- [ ] `package-history` (Version tracking).
- [ ] `package-transaction` (Purchase logs).

### 🏷️ Vouchers & Pricing
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ✅
- [ ] `plan` (Core plan definitions).
- [ ] `coupon` (Discounts and logic).

---

## 🔄 Phase 3: Subscriptions, Wallets & Billing

### 💳 Subscription Lifecycle
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ✅
- [ ] `user-subscription` (Activation/Renewal).
- [ ] `user-wallet` (Balance management).

### 🧾 Billing & Analytics
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ✅
- [ ] `billing-setting` (Global settings).
- [ ] `billing-setting-history` (Setting logs).
- [ ] `dashboard` (Analytics aggregations).

---

## 🤖 Phase 4: AI Models & Credit System

### 🪙 Credit Economy
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ✅
- [ ] `credits-process` (Processing transactions).
- [ ] `credits-profit` (Profit calculation).
- [ ] `credits-profit-history` (Profit logs).
- [ ] `credits-transaction` (General ledger).
- [ ] `credits-usage` (Consumption logs).

### 🧠 AI Engine
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ✅
- [ ] `ai-model` (Model definitions).
- [ ] `ai-model-history` (Usage history).

---

## 📢 Phase 5: Engagement, Communication & Logs

### ✨ Features & Usage
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ✅
- [ ] `feature` (Capability definitions).
- [ ] `feature-endpoint` (API mapping).
- [ ] `feature-popup` (UI engagement).
- [ ] `feature-feedback` (User reviews).
- [ ] `feature-usage-log` (Interaction tracking).

### 📨 Comms & Support
**Migration Flow (Ea.):** `repo` ➔ `service` ➔ `tests` ➔ `VERIFY` ✅
- [ ] `notification` (System messages).
- [ ] `notification-recipient` (Delivery status).
- [ ] `contact` (User inquiries).

---

## 🧹 Phase 6: Infrastructure Finalization
- [ ] Standardize `AppAggregationQuery` usage in all repositories.
- [ ] Final architecture audit across all 33 modules.
- [ ] Update `project_structure.md` with final mandatory role definitions.
