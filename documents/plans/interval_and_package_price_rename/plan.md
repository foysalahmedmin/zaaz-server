# Module Rename Refactor: `plan` → `interval` & `package-plan` → `package-price`

## Motivation

### ❌ Current Naming Problem

The current names `plan` and `package-plan` conflict with industry-standard SaaS terminology.

| Module | What it actually stores | Industry expectation of the name |
|---|---|---|
| `plan` | Billing duration only (monthly, yearly) | The entire product offering (tier + price) |
| `package-plan` | Price for a Package × Plan combination | A sub-plan or variant of a package |

This creates semantic confusion — a new developer reading `plan` expects it to represent a full subscription plan, not just a billing cycle duration.

### ✅ Proposed Naming

| Current | Renamed | Why |
|---|---|---|
| `plan` | `interval` | Explicitly describes billing duration. Stripe uses `interval` for this exact concept (`month`, `year`, `week`). |
| `package-plan` | `package-price` | Accurately represents what it is — the price for a Package at a given Interval. Maps directly to Stripe's `Price` object concept. |

---

## Domain Model (After Rename)

```
Package (Basic, Pro, Enterprise)
  └── PackagePrice (Package × Interval = Price)
        └── Interval (monthly, yearly, one-time)
```

**Example:**
```
Package: "Pro"
  PackagePrice: "Pro - Monthly"  → interval: monthly, price: $29
  PackagePrice: "Pro - Yearly"   → interval: yearly,  price: $290
```

This maps cleanly to the Stripe model:
```
Stripe Product → Package
Stripe Price   → PackagePrice
Stripe Interval → Interval
```

---

## Scope of Changes

### Modules directly renamed (2)

| From | To |
|---|---|
| `src/modules/plan/` | `src/modules/interval/` |
| `src/modules/package-plan/` | `src/modules/package-price/` |

### External modules requiring updates (6)

| Module | What changes |
|---|---|
| `package` | $lookup collection names, aggregation field names, variable names, imports |
| `package-history` | `plans` field → `prices` (if present in model) |
| `user-subscription` | `plan` field → `interval`, `ref: 'Plan'` → `ref: 'Interval'` |
| `user-wallet` | imports, `plan_id` → `interval_id`, variable names |
| `payment-transaction` | `plan` field → `interval`, model ref, service variables, event types |
| `coupon` | import, `planId` → `intervalId` |

### Infrastructure files (2)

| File | What changes |
|---|---|
| `src/routes.ts` | Import names, path strings |
| `src/scripts/migrate-subscriptions.ts` | Field references |

---

## Key Rename Mappings

### Type names
| From | To |
|---|---|
| `TPlan` | `TInterval` |
| `TPlanDocument` | `TIntervalDocument` |
| `TPlanModel` | `TIntervalModel` |
| `TPackagePlan` | `TPackagePrice` |
| `TPackagePlanDocument` | `TPackagePriceDocument` |
| `TPackagePlanModel` | `TPackagePriceModel` |

### Mongoose model & collection
| From | To |
|---|---|
| Model `Plan` | Model `Interval` |
| Collection `plans` | Collection `intervals` |
| Model `PackagePlan` | Model `PackagePrice` |
| Collection `packageplans` | Collection `packageprices` |
| `ref: 'Plan'` (all models) | `ref: 'Interval'` |
| `ref: 'PackagePlan'` (all models) | `ref: 'PackagePrice'` |

### Internal field in PackagePrice model
| From | To |
|---|---|
| `plan: ObjectId → ref Plan` | `interval: ObjectId → ref Interval` |
| Compound index `{ package: 1, plan: 1 }` | `{ package: 1, interval: 1 }` |

### Fields in other models
| Model | Field change |
|---|---|
| `user-subscription` | `plan` → `interval` |
| `payment-transaction` | `plan` → `interval` |
| `package-price` (internal) | `plan` → `interval` |

### Cache keys (interval module)
| From | To |
|---|---|
| `plan:*` | `interval:*` |
| `plans:*` | `intervals:*` |

### Route URLs
| From | To |
|---|---|
| `GET /api/plans` | `GET /api/intervals` |
| `GET /api/plans/public` | `GET /api/intervals/public` |
| `GET /api/package-plans` | `GET /api/package-prices` |

### Package aggregation fields (package.service.ts)
| From | To |
|---|---|
| `from: 'packageplans'` | `from: 'packageprices'` |
| `from: 'plans'` | `from: 'intervals'` |
| `as: 'plans'` | `as: 'prices'` |
| `plans?: Array<{ plan: ObjectId }>` | `prices?: Array<{ interval: ObjectId }>` |

---

## Execution Order

```
Phase 1: interval module (all internal files)
    ↓
Phase 2: package-price module (all internal files)
    ↓
Phase 3: routes.ts
    ↓
Phase 4: package module (aggregation + imports)
    ↓
Phase 5: package-history module (field check + update)
    ↓
Phase 6: user-subscription module (field + type)
    ↓
Phase 7: user-wallet module (imports + variables)
    ↓
Phase 8: payment-transaction module (model + service + events)
    ↓
Phase 9: coupon module (import + variables)
    ↓
Phase 10: tests (all affected test files)
    ↓
Phase 11: migration script
    ↓
Phase 12: full test suite run + commit
```

---

## Risk Areas

| Risk | Mitigation |
|---|---|
| MongoDB `$lookup` collection names are hardcoded strings — TypeScript won't catch typos | Double-check every aggregation pipeline manually |
| `ref: 'Plan'` / `ref: 'PackagePlan'` in Mongoose models — wrong ref breaks `.populate()` silently | Grep all model files for `ref:` after rename |
| `user-subscription.plan` field rename breaks existing DB documents | Migration script needed if data exists |
| `payment-transaction.plan` field rename breaks existing DB documents | Migration script needed if data exists |
| Cache keys — old `plan:*` keys won't be invalidated by new `interval:*` pattern | Flush cache on deploy |
