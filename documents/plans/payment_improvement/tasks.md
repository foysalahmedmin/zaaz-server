# Payment Improvement — Task List

## Phase 1 — Automated Reconciliation Cron Job

- [x] Add reconciliation cron to `src/jobs/index.ts` (runs every 15 minutes, calls `reconcilePendingTransactions()`)

---

## Phase 2 — handlePaymentCompleted Failure Isolation

- [x] Add `consumer_processed: boolean` field to `TPaymentTransaction` type (`payment-transaction.type.ts`)
- [x] Add `consumer_processed` field to Mongoose schema with index (`payment-transaction.model.ts`)
- [x] Set `consumer_processed: true` inside `handlePaymentCompleted` after successful commit (`payment.consumers.ts`)
- [x] Add `retryUnprocessedPaymentConsumers()` function — finds unprocessed success transactions and retries (`payment.consumers.ts`)
- [x] Add inline retry logic in `updatePaymentTransactionStatus` — 3 attempts with exponential backoff (2s, 4s, 8s) (`payment.service.ts`)
- [x] Add consumer retry cron to `src/jobs/index.ts` (runs every 30 minutes, calls `retryUnprocessedPaymentConsumers()`)

---

## Phase 3 — Hard Refund (Admin Only)

### Gateway layer
- [x] Add `RefundResponse` interface to `src/providers/payment-gateways/index.ts`
- [x] Add `refund()` method to `IPaymentGateway` interface
- [x] Implement `refund()` in `StripeService` — retrieves payment intent from session, calls `stripe.refunds.create()`
- [x] Implement `refund()` in `SSLCommerzService` — calls SSLCommerz refund API
- [x] Implement `refund()` in `BkashService` — wraps existing `refundTransaction()` as a private method, exposes `refund()` on the interface

### Business logic layer
- [x] Add `revokePackageCredits(payment_transaction_id, session)` to `user-wallet.service.ts`
  - Looks up PackagePrice to get credits amount
  - Deducts credits from UserWallet (`$inc: -credits`)
  - Marks linked PackageTransaction as `is_active: false`
- [x] Add `initiateRefund(id, admin_note?)` to `payment.service.ts`
  - Validates transaction is `status: 'success'`
  - Calls gateway `refund()`
  - Calls `revokePackageCredits()`
  - Updates status to `refunded`, sets `refund_id` and `refunded_at`
  - Writes audit log entry (`source: ADMIN_REFUND`)
- [x] Add `refundPaymentValidationSchema` to `payment.validator.ts`
- [x] Add `refundPayment` controller to `payment.controller.ts`
- [x] Add `POST /:id/refund` route to `payment.route.ts` (admin only)

---

## Verification

- [x] TypeScript check — 0 errors in payment-related files
- [x] Full test suite — 65 suites, 256 tests passing
