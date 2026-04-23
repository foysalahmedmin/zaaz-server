# Payment Improvement Plan

## Overview

Three improvements implemented sequentially:
1. Automated Reconciliation Cron Job
2. `handlePaymentCompleted` Failure Isolation
3. Hard Refund (Admin)

---

## Phase 1 — Automated Reconciliation Cron Job

### Problem
`reconcilePendingTransactions()` service existed but had to be triggered manually via `POST /api/payments/reconcile`.
If a webhook was missed, the transaction would stay `pending` — the user was charged but never received their package.

### Solution
Add a cron job in `jobs/index.ts` that runs `reconcilePendingTransactions()` every **15 minutes** automatically.

### Files changed
- `src/jobs/index.ts`

### Implementation
```
Schedule : every 15 minutes  ('*/15 * * * *')
Action   : reconcilePendingTransactions()
On error : caught and logged — cron keeps running
```

---

## Phase 2 — handlePaymentCompleted Failure Isolation

### Problem
`updatePaymentTransactionStatus()` marks a payment as `success`, then calls `handlePaymentCompleted()` to assign credits.
If `handlePaymentCompleted` threw an error, the payment stayed `success` but credits were never assigned — with no retry mechanism when RabbitMQ is disabled.

### Solution — `consumer_processed` flag + retry cron

**Step 1:** Add `consumer_processed: boolean` field to `TPaymentTransaction` type and model.

**Step 2:** Set `consumer_processed: true` on the transaction once `handlePaymentCompleted` completes successfully.

**Step 3:** Inline retry — if `handlePaymentCompleted` fails, retry up to 3 times with exponential backoff (2s → 4s → 8s).

**Step 4:** Add a cron job in `jobs/index.ts` that runs every **30 minutes**, finds `success` transactions where `consumer_processed !== true`, and retries `handlePaymentCompleted` for each.

### Files changed
- `src/modules/payment-transaction/payment-transaction.type.ts`
- `src/modules/payment-transaction/payment-transaction.model.ts`
- `src/modules/payment/payment.consumers.ts`
- `src/modules/payment/payment.service.ts`
- `src/jobs/index.ts`

### Data flow
```
updatePaymentTransactionStatus('success')
  └─ handlePaymentCompleted()  [up to 3 attempts with backoff]
       ✅ success  →  consumer_processed: true
       ❌ all fail →  consumer_processed: false  (cron picks it up)

Cron (every 30 min):
  find: { status: 'success', consumer_processed: { $ne: true } }
  └─ handlePaymentCompleted()  [retried per transaction]
       ✅ success  →  consumer_processed: true
```

---

## Phase 3 — Hard Refund (Admin Only)

### Problem
No way for admins to process refunds from the admin panel.

### Solution
Admin triggers `POST /api/payments/:id/refund` → gateway refund API is called → credits are revoked → status changes to `refunded`.

### Gateway refund support
| Gateway | Refund API | Status |
|---|---|---|
| **Stripe** | `stripe.refunds.create({ payment_intent })` | Implemented |
| **SSLCommerz** | SSLCommerz Refund API | Implemented |
| **bKash** | `/tokenized/checkout/payment/refund` | Wrapped existing `refundTransaction()` |

### Design decision
Only **full refund** is supported. Partial refund was considered but rejected because:
- SSLCommerz and bKash do not support partial refunds
- The product is credits-based SaaS — partial refund logic would be overly complex
- All three gateways support full refund, keeping the implementation consistent

### Files changed

**Gateway layer:**
- `src/providers/payment-gateways/index.ts` — `RefundResponse` interface + `refund()` added to `IPaymentGateway`
- `src/providers/payment-gateways/stripe/stripe.service.ts`
- `src/providers/payment-gateways/sslcommerz/sslcommerz.service.ts`
- `src/providers/payment-gateways/bkash/bkash.service.ts`

**Business logic layer:**
- `src/modules/user-wallet/user-wallet.service.ts` — `revokePackageCredits()` added
- `src/modules/payment/payment.service.ts` — `initiateRefund()` added
- `src/modules/payment/payment.validator.ts` — `refundPaymentValidationSchema` added
- `src/modules/payment/payment.controller.ts` — `refundPayment` controller added
- `src/modules/payment/payment.route.ts` — `POST /:id/refund` route added (admin only)

### initiateRefund flow
```
1. Fetch transaction — must have status: 'success'
2. Call gateway.refund(gatewayTransactionId, amount, currency)
3. Call revokePackageCredits(payment_transaction_id, session)
   └─ Deduct credits from UserWallet  ($inc: -credits)
   └─ Mark linked PackageTransaction as is_active: false
4. Update transaction status → 'refunded', set refund_id and refunded_at
5. Write audit log entry (source: ADMIN_REFUND)
```

### API
```
POST /api/payments/:id/refund
Auth : admin only
Body : { admin_note?: string }
```

---

## Summary

| Phase | Scope | Files |
|---|---|---|
| Phase 1 — Reconciliation Cron | 1 file | `jobs/index.ts` |
| Phase 2 — Consumer Failure Isolation | 5 files | type, model, consumers, service, jobs |
| Phase 3 — Hard Refund | 9 files | 4 gateway + 5 business logic |

**Total files changed: 15**
