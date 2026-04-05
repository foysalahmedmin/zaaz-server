# ADR 002: Payment Method Recurring Support Identifier

**Date:** 2026-04-05
**Status:** Accepted (Implemented)
**Objective:** Differentiate between "Automatic Renewal" and "Manual Renewal" payment methods.

---

## 1. Context
ZaaZ platform offers subscriptions. Some payment methods (Stripe, PayPal) support recurring billing (auto-renewal), while others (bKash, Nagad) require the user to pay manually each time. Without an identifier, the system cannot decide whether to attempt an auto-charge or send a manual renewal reminder.

## 2. Decision: Add `is_recurring` flag
We added a boolean field to the Payment Method module:
- `is_recurring: true`: The gateway supports periodic automatic deductions.
- `is_recurring: false`: The gateway is one-time only.

## 3. Implementation Details
1.  **Schema:** `is_recurring` (Boolean, default: false).
2.  **Validation:** Exposed via `zod` for Admin management.
3.  **UI/UX (Future):** Frontend can use this to show "Auto-renew" toggles or "Manual payment" notices during checkout.

## 4. Consequences
- **Logic decoupling:** The Subscription service can remain generic; it just checks the flag of the chosen payment method.
- **Improved UX:** Prevents users from being confused when they choose bKash but expect an auto-renewal.
