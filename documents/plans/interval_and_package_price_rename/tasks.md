# Rename Refactor Tasks: `plan` → `interval` & `package-plan` → `package-price`

**Workflow:** `rename files` ➔ `update content` ➔ `update externals` ➔ `tests` ➔ `VERIFY` ➔ `GIT COMMIT` ✅

---

## Phase 1: `interval` module (was `plan`)

### 1.1 — Rename directory & files
- [ ] Rename `src/modules/plan/` → `src/modules/interval/`
- [ ] `plan.type.ts` → `interval.type.ts`
- [ ] `plan.model.ts` → `interval.model.ts`
- [ ] `plan.service.ts` → `interval.service.ts`
- [ ] `plan.controller.ts` → `interval.controller.ts`
- [ ] `plan.route.ts` → `interval.route.ts`
- [ ] `plan.repository.ts` → `interval.repository.ts`
- [ ] `plan.validator.ts` → `interval.validator.ts`
- [ ] `__tests__/plan.service.spec.ts` → `__tests__/interval.service.spec.ts`
- [ ] `__tests__/plan.route.spec.ts` → `__tests__/interval.route.spec.ts`

### 1.2 — `interval.type.ts`
- [ ] `TPlan` → `TInterval`
- [ ] `TPlanDocument` → `TIntervalDocument`
- [ ] `TPlanModel` → `TIntervalModel`
- [ ] Static method signature: `isPlanExist` → `isIntervalExist`

### 1.3 — `interval.model.ts`
- [ ] Schema variable: `planSchema` → `intervalSchema`
- [ ] Static method: `isPlanExist` → `isIntervalExist`
- [ ] Instance method: `softDelete` (keep name, update internal refs)
- [ ] Model registration: `Plan` → `Interval`
- [ ] All internal `TPlan*` → `TInterval*` type references

### 1.4 — `interval.repository.ts`
- [ ] All import paths: `./plan.*` → `./interval.*`
- [ ] All `TPlan*` → `TInterval*` type references
- [ ] Export rename: `Plan` model export → `Interval`
- [ ] Function `findActive` — update internal model reference

### 1.5 — `interval.service.ts`
- [ ] All import paths: `./plan.*` → `./interval.*`
- [ ] All `TPlan*` → `TInterval*` type references
- [ ] Import: `Plan` → `Interval` (from repository)
- [ ] `createPlan` → `createInterval`
- [ ] `getPlan` → `getInterval`
- [ ] `getPlans` → `getIntervals`
- [ ] `updatePlan` → `updateInterval`
- [ ] `updatePlans` → `updateIntervals`
- [ ] `deletePlan` → `deleteInterval`
- [ ] `deletePlanPermanent` → `deleteIntervalPermanent`
- [ ] `deletePlans` → `deleteIntervals`
- [ ] `deletePlansPermanent` → `deleteIntervalsPermanent`
- [ ] `restorePlan` → `restoreInterval`
- [ ] `restorePlans` → `restoreIntervals`
- [ ] Cache keys: `plan:*` → `interval:*`, `plans:*` → `intervals:*`
- [ ] Error messages: `"Plan not found"` → `"Interval not found"`, `"Plan not found or not deleted"` → `"Interval not found or not deleted"`

### 1.6 — `interval.controller.ts`
- [ ] All import paths: `./plan.*` → `./interval.*`
- [ ] Import: `*PlanServices` → `*IntervalServices`
- [ ] `createPlan` → `createInterval`
- [ ] `getPlan` → `getInterval`
- [ ] `getPublicPlans` → `getPublicIntervals`
- [ ] `getPlans` → `getIntervals`
- [ ] `updatePlan` → `updateInterval`
- [ ] `updatePlans` → `updateIntervals`
- [ ] `deletePlan` → `deleteInterval`
- [ ] `deletePlanPermanent` → `deleteIntervalPermanent`
- [ ] `deletePlans` → `deleteIntervals`
- [ ] `deletePlansPermanent` → `deleteIntervalsPermanent`
- [ ] `restorePlan` → `restoreInterval`
- [ ] `restorePlans` → `restoreIntervals`
- [ ] All success messages: `"Plan ..."` → `"Interval ..."`

### 1.7 — `interval.route.ts`
- [ ] All import paths: `./plan.*` → `./interval.*`
- [ ] Import: `*PlanControllers` → `*IntervalControllers`
- [ ] Import: `*PlanValidations` → `*IntervalValidations`
- [ ] All controller function references updated

### 1.8 — `interval.validator.ts`
- [ ] All import paths (if any): updated
- [ ] Error messages: `"plan ID"` → `"interval ID"`, `"plan is required"` → `"interval is required"`
- [ ] Export names: `*plan*` → `*interval*` (e.g. `planOperationValidationSchema` → `intervalOperationValidationSchema`)

### 1.9 — `__tests__/interval.service.spec.ts`
- [ ] All import paths: `../plan.*` → `../interval.*`
- [ ] Mock path: `'../plan.repository'` → `'../interval.repository'`
- [ ] All `TPlan*`, `Plan*` → `TInterval*`, `Interval*`
- [ ] All service function call names updated
- [ ] describe/it strings: `"Plan ..."` → `"Interval ..."`

### 1.10 — `__tests__/interval.route.spec.ts`
- [ ] Import paths updated
- [ ] Mock path updated
- [ ] URL: `/api/plans` → `/api/intervals`
- [ ] All service mock function names updated

---

## Phase 2: `package-price` module (was `package-plan`)

### 2.1 — Rename directory & files
- [ ] Rename `src/modules/package-plan/` → `src/modules/package-price/`
- [ ] `package-plan.type.ts` → `package-price.type.ts`
- [ ] `package-plan.model.ts` → `package-price.model.ts`
- [ ] `package-plan.service.ts` → `package-price.service.ts`
- [ ] `package-plan.controller.ts` → `package-price.controller.ts`
- [ ] `package-plan.route.ts` → `package-price.route.ts`
- [ ] `package-plan.repository.ts` → `package-price.repository.ts`
- [ ] `package-plan.validator.ts` → `package-price.validator.ts`
- [ ] `__tests__/package-plan.service.spec.ts` → `__tests__/package-price.service.spec.ts`
- [ ] `__tests__/package-plan.route.spec.ts` → `__tests__/package-price.route.spec.ts`

### 2.2 — `package-price.type.ts`
- [ ] `TPackagePlan` → `TPackagePrice`
- [ ] `TPackagePlanDocument` → `TPackagePriceDocument`
- [ ] `TPackagePlanModel` → `TPackagePriceModel`
- [ ] Internal field: `plan: ObjectId` → `interval: ObjectId`
- [ ] Static method signature: `isPackagePlanExist` → `isPackagePriceExist`

### 2.3 — `package-price.model.ts`
- [ ] Schema variable: `packagePlanSchema` → `packagePriceSchema`
- [ ] Field: `plan: { ref: 'Plan' }` → `interval: { ref: 'Interval' }`
- [ ] Compound index: `{ package: 1, plan: 1 }` → `{ package: 1, interval: 1 }`
- [ ] Static method: `isPackagePlanExist` → `isPackagePriceExist`
- [ ] Model registration: `PackagePlan` → `PackagePrice`
- [ ] All `TPackagePlan*` → `TPackagePrice*` type references

### 2.4 — `package-price.repository.ts`
- [ ] All import paths: `./package-plan.*` → `./package-price.*`
- [ ] All `TPackagePlan*` → `TPackagePrice*`
- [ ] Export rename: `PackagePlan` → `PackagePrice`
- [ ] All internal variable names: `packagePlan*` → `packagePrice*`

### 2.5 — `package-price.service.ts`
- [ ] All import paths updated
- [ ] Import: `PackagePlan` → `PackagePrice` (from repository)
- [ ] Import: `PlanRepository` → `IntervalRepository` (from interval module)
- [ ] Internal variable references to `plan` field → `interval`
- [ ] `createPackagePlan` → `createPackagePrice`
- [ ] `createPackagePlans` → `createPackagePrices`
- [ ] `getPackagePlan` → `getPackagePrice`
- [ ] `getPackagePlans` → `getPackagePrices`
- [ ] `getPackagePlansByPackage` → `getPackagePricesByPackage`
- [ ] `getInitialPackagePlan` → `getInitialPackagePrice`
- [ ] `updatePackagePlan` → `updatePackagePrice`
- [ ] `deletePackagePlan` → `deletePackagePrice`
- [ ] `deletePackagePlansByPackage` → `deletePackagePricesByPackage`
- [ ] `restorePackagePlansByPackage` → `restorePackagePricesByPackage`
- [ ] Error messages: `"Package-plan not found"` → `"Package-price not found"`, `"Package-plan combination already exists"` → `"Package-price combination already exists"`
- [ ] Validation messages: `"Plan not found or not active"` → `"Interval not found or not active"`

### 2.6 — `package-price.controller.ts`
- [ ] All import paths updated
- [ ] `createPackagePlan` → `createPackagePrice`
- [ ] `createPackagePlans` → `createPackagePrices`
- [ ] `getPackagePlan` → `getPackagePrice`
- [ ] `getPackagePlans` → `getPackagePrices`
- [ ] `updatePackagePlan` → `updatePackagePrice`
- [ ] `deletePackagePlan` → `deletePackagePrice`
- [ ] All success messages: `"Package-plan ..."` → `"Package-price ..."`

### 2.7 — `package-price.route.ts`
- [ ] All import paths updated
- [ ] Import: `*PackagePlanControllers` → `*PackagePriceControllers`
- [ ] Import: `*PackagePlanValidations` → `*PackagePriceValidations`
- [ ] All controller function references updated

### 2.8 — `package-price.validator.ts`
- [ ] All import paths updated
- [ ] Error messages: `"package-plan"` → `"package-price"`
- [ ] Export names: `*packagePlan*` → `*packagePrice*`

### 2.9 — `__tests__/package-price.service.spec.ts`
- [ ] All import paths updated
- [ ] Mock path: `'../package-plan.repository'` → `'../package-price.repository'`
- [ ] Mock path: `'../plan/plan.repository'` → `'../interval/interval.repository'` (if mocked)
- [ ] All `TPackagePlan*`, `PackagePlan*` → `TPackagePrice*`, `PackagePrice*`
- [ ] All service function call names updated
- [ ] describe/it strings updated

### 2.10 — `__tests__/package-price.route.spec.ts`
- [ ] Import paths updated
- [ ] Mock path updated
- [ ] URL: `/api/package-plans` → `/api/package-prices`
- [ ] All service mock function names updated

---

## Phase 3: `routes.ts`

- [ ] Import: `PlanRoutes` from `./modules/interval/interval.route`
- [ ] Import: `PackagePlanRoutes` → `PackagePriceRoutes` from `./modules/package-price/package-price.route`
- [ ] Path: `'/plans'` → `'/intervals'`
- [ ] Path: `'/package-plans'` → `'/package-prices'`

---

## Phase 4: `package` module

- [ ] Import: `PlanRepository` → `IntervalRepository` from `../interval/interval.repository`
- [ ] Import functions: `createPackagePlans` → `createPackagePrices`, `deletePackagePlansByPackage` → `deletePackagePricesByPackage`, `getPackagePlansByPackage` → `getPackagePricesByPackage`
- [ ] Aggregation $lookup: `from: 'packageplans'` → `from: 'packageprices'`
- [ ] Aggregation $lookup: `from: 'plans'` → `from: 'intervals'`
- [ ] Aggregation output: `as: 'plans'` → `as: 'prices'`
- [ ] Interface field: `plans?: Array<{ plan: ... }>` → `prices?: Array<{ interval: ... }>`
- [ ] All variable names: `planIds` → `intervalIds`, `planId` → `intervalId`, `planDocs` → `intervalDocs`, `newPlanIds` → `newIntervalIds`, `oldPlanIds` → `oldIntervalIds`, `planIdsToAdd` → `intervalIdsToAdd`, `addedPlanInputs` → `addedIntervalInputs`
- [ ] All field access: `.plan` → `.interval` where referencing the interval field
- [ ] Error messages: `"At least one plan is required"` → `"At least one interval is required"`

---

## Phase 5: `package-history` module

- [ ] Check `package-history.type.ts` — if `plans` field exists: rename to `prices`
- [ ] Check `package-history.model.ts` — if `plans` field exists: rename to `prices`, update `ref` if any
- [ ] Check `package-history.service.ts` — update any `plans`/`plan` references

---

## Phase 6: `user-subscription` module

- [ ] `user-subscription.type.ts`: `plan: ObjectId` → `interval: ObjectId`
- [ ] `user-subscription.model.ts`: field `plan` → `interval`, `ref: 'Plan'` → `ref: 'Interval'`
- [ ] `user-subscription.service.ts`: all `plan` field references → `interval`
- [ ] `user-subscription.repository.ts`: all `plan` field references → `interval`

---

## Phase 7: `user-wallet` module

- [ ] `user-wallet.service.ts`: Import `Plan` → `Interval` from interval module
- [ ] `user-wallet.service.ts`: Import `getPackagePlansByPackage` → `getPackagePricesByPackage`
- [ ] Parameter: `plan_id` → `interval_id` (function signature + destructuring)
- [ ] Variable: `planData` → `intervalData`
- [ ] All field references: `plan:` → `interval:` where building subscription/wallet objects
- [ ] Error messages: `"Plan not found"` → `"Interval not found"`, `"No initial plan found"` → `"No initial interval found"`

---

## Phase 8: `payment-transaction` module

- [ ] `payment-transaction.model.ts`: field `plan` → `interval`, `ref: 'Plan'` → `ref: 'Interval'`
- [ ] `payment-transaction.type.ts`: `plan: ObjectId` → `interval: ObjectId`
- [ ] `payment-transaction.service.ts`: Import `Plan` → `Interval`
- [ ] `payment-transaction.service.ts`: Import `PackagePlan` → `PackagePrice`
- [ ] `payment-transaction.service.ts`: Variable `planId` → `intervalId`, `plan:` → `interval:`
- [ ] `payment-transaction.controller.ts`: `planId` → `intervalId`
- [ ] `payment.consumers.ts`: `plan_id: transaction.plan` → `interval_id: transaction.interval`
- [ ] `payment.events.ts`: `planId?:` → `intervalId?:`

---

## Phase 9: `coupon` module

- [ ] `coupon.service.ts`: Import `PackagePlan` → `PackagePrice`
- [ ] `coupon.service.ts`: Parameter `planId` → `intervalId`
- [ ] `coupon.service.ts`: Field `plan: planId` → `interval: intervalId`
- [ ] Error messages: `"Package plan not found"` → `"Package price not found"`

---

## Phase 10: Tests (affected external modules)

- [ ] `package/__tests__/package.service.spec.ts` — mock data field `plans` → `prices`, `plan` → `interval`
- [ ] `coupon/__tests__/coupon.service.spec.ts` — `planId` → `intervalId`, mock references
- [ ] `payment-transaction/__tests__/payment-transaction.route.spec.ts` — `plan` → `interval` field in mocks
- [ ] `user-subscription/__tests__/user-subscription.service.spec.ts` — `plan` → `interval` field in mocks

---

## Phase 11: Migration script

- [ ] `src/scripts/migrate-subscriptions.ts`: `{ plan: { $exists: true } }` → `{ interval: { $exists: true } }`
- [ ] `src/scripts/migrate-subscriptions.ts`: `plan: wallet.plan` → `interval: wallet.interval`

---

## Phase 12: Verify & Commit

- [ ] Run full test suite: `npx jest --no-coverage`
- [ ] Confirm all 62 test suites pass
- [ ] Grep check — no remaining `from: 'plans'` or `from: 'packageplans'` in aggregations
- [ ] Grep check — no remaining `ref: 'Plan'` or `ref: 'PackagePlan'` in model files
- [ ] **GIT COMMIT** ✅
