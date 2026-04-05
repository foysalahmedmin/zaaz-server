# Plan: Payment Method Renewal Support

**Objective:** Add an identifier to Payment Methods to distinguish between those that support automatic recurring billing (subscriptions) and those that only support one-time manual payments.

---

## 1. Strategy
We will add a boolean flag `is_recurring` to the `PaymentMethod` model.
- `true`: Supports auto-renewal (e.g., Stripe, PayPal Subscriptions).
- `false`: Manual renewal only (e.g., bKash, Manual Bank Transfer).

This flag will be used by the Subscription Service to decide whether to:
1.  Attempt an automatic charge on the next billing date.
2.  Send a "Manual Payment Required" notification to the user before expiration.

## 2. Data Layer Changes

### PaymentMethod Schema
- Field: `is_recurring`
- Type: `Boolean`
- Default: `false`

### Types
- Update `TPaymentMethod` interface.

## 3. API Changes
- Update Validator to allow `is_recurring` in creation/update payloads.
- Update documentation to reflect the new field.

## 4. Business Logic (Conceptual)
When a user selects a payment method for a subscription:
- If `method.is_recurring == false`, the system sets `subscription.auto_renew = false`.
- The `ExpirationJob` will check this flag 3 days before expiry to trigger a "Renewal Reminder" email.
