# Payment Gateway Fields Summary

## Overview
এই document-এ payment gateway integration-এর জন্য models-এ যোগ করা নতুন fields-এর বিস্তারিত বিবরণ দেওয়া আছে।

---

## PaymentTransaction Model - নতুন Fields

### 1. `gateway_session_id` (Optional)
- **Type**: String
- **Purpose**: Payment gateway-এর session ID store করে
- **Use Cases**:
  - Stripe: Checkout session ID
  - SSL Commerz: Session ID from gateway response
- **Indexed**: Yes (for faster lookups)

### 2. `gateway_status` (Optional)
- **Type**: String
- **Purpose**: Gateway-specific status store করে
- **Examples**:
  - Stripe: "paid", "unpaid", "no_payment_required"
  - SSL Commerz: "VALID", "VALIDATED", "FAILED"
- **Note**: আমাদের internal `status` field-এর সাথে আলাদা (pending, success, failed, refunded)

### 3. `gateway_fee` (Optional)
- **Type**: Number
- **Purpose**: Payment gateway charge করা fee amount
- **Use Case**: Revenue calculation এবং accounting-এর জন্য

### 4. `failure_reason` (Optional)
- **Type**: String
- **Purpose**: Payment fail হলে reason store করে
- **Examples**: "Insufficient funds", "Card declined", "Payment failed at gateway"

### 5. `refund_id` (Optional)
- **Type**: String
- **Purpose**: Gateway-এর refund transaction ID
- **Use Case**: Refund track করার জন্য

### 6. `refunded_at` (Optional)
- **Type**: Date
- **Purpose**: Refund করা date/time
- **Use Case**: Refund history track করার জন্য

### 7. `paid_at` (Optional)
- **Type**: Date
- **Purpose**: Payment complete হওয়ার exact date/time
- **Use Case**: Payment timeline track করার জন্য

### 8. `customer_email` (Optional)
- **Type**: String (lowercase)
- **Purpose**: Gateway থেকে পাওয়া customer email
- **Use Case**: Customer communication এবং verification

### 9. `customer_name` (Optional)
- **Type**: String
- **Purpose**: Gateway থেকে পাওয়া customer name
- **Use Case**: Customer identification

### 10. `gateway_response` (Optional)
- **Type**: Mixed (JSON object)
- **Purpose**: Gateway থেকে পাওয়া raw response data store করে
- **Select**: false (default queries-এ include হয় না, performance-এর জন্য)
- **Use Cases**:
  - Debugging
  - Audit trail
  - Gateway-specific data access
  - Dispute resolution

---

## PaymentMethod Model - নতুন Fields

### 1. `webhook_url` (Optional)
- **Type**: String (URL)
- **Purpose**: এই payment method-এর webhook URL
- **Use Case**: Webhook configuration track করার জন্য
- **Example**: `https://yourdomain.com/api/payment-transactions/webhook/{payment_method_id}`

### 2. `test_mode` (Optional)
- **Type**: Boolean
- **Default**: false
- **Purpose**: Test/sandbox mode enable/disable
- **Use Case**: Production vs Sandbox environment distinguish করার জন্য

### 3. `supported_currencies` (Optional)
- **Type**: Array of Strings
- **Default**: []
- **Purpose**: এই gateway support করা currencies-এর list
- **Use Case**: Multi-currency support
- **Example**: `["USD", "EUR", "GBP"]`

### 4. `config` (Optional)
- **Type**: Mixed (JSON object)
- **Purpose**: Gateway-specific additional configuration
- **Select**: false (default queries-এ include হয় না)
- **Use Cases**:
  - Gateway-specific settings
  - Custom parameters
  - Feature flags
  - Environment-specific configs

---

## TokenTransaction Model

**No new fields needed** - এই model payment transaction থেকে automatically create হয় এবং সব প্রয়োজনীয় information payment_transaction reference থেকে পাওয়া যায়।

---

## Field Usage in Services

### Payment Initiation (`initiatePayment`)
```typescript
// Stores:
- gateway_transaction_id
- gateway_session_id
- gateway_response (initial response)
```

### Webhook Handling (`handlePaymentWebhook`)
```typescript
// Updates:
- gateway_status (from webhook)
- gateway_response (raw webhook payload)
- status (success/failed)
- paid_at (if success)
- failure_reason (if failed)
- customer_email, customer_name (if available)
```

### Status Update (`updatePaymentTransactionStatus`)
```typescript
// Updates:
- status
- paid_at (if status = success)
- refunded_at (if status = refunded)
```

---

## Database Indexes

### PaymentTransaction
- `gateway_transaction_id` - Indexed (for webhook lookups)
- `gateway_session_id` - Indexed (for alternative lookup)
- `user` - Indexed (for user queries)
- `user_wallet` - Indexed (for wallet queries)

---

## Important Notes

1. **gateway_response Field**:
   - Default queries-এ include হয় না (performance)
   - Explicitly select করতে হবে: `.select('+gateway_response')`
   - Large data store করতে পারে, তাই careful use করুন

2. **config Field (PaymentMethod)**:
   - Default queries-এ include হয় না
   - Gateway-specific settings store করার জন্য

3. **Backward Compatibility**:
   - সব নতুন fields optional, তাই existing data-এর সাথে compatible
   - Migration script-এর দরকার নেই

4. **Security**:
   - `gateway_response` এবং `config` fields sensitive data contain করতে পারে
   - Admin-only access ensure করুন

---

## Example Usage

### Creating Payment Transaction with Gateway Info
```typescript
const transaction = await PaymentTransaction.create({
  user: userId,
  user_wallet: walletId,
  payment_method: paymentMethodId,
  gateway_transaction_id: 'stripe_session_123',
  gateway_session_id: 'stripe_session_123',
  gateway_response: {
    redirectUrl: 'https://checkout.stripe.com/...',
    initiatedAt: new Date().toISOString()
  },
  // ... other fields
});
```

### Updating from Webhook
```typescript
await PaymentTransaction.findByIdAndUpdate(transactionId, {
  gateway_status: 'paid',
  status: 'success',
  paid_at: new Date(),
  gateway_response: webhookPayload, // Store full webhook data
  customer_email: webhookPayload.customer_email,
});
```

### Querying with Gateway Response
```typescript
// Get transaction with gateway response
const transaction = await PaymentTransaction.findById(id)
  .select('+gateway_response')
  .lean();
```

---

## Benefits

1. **Complete Audit Trail**: সব gateway interaction store হয়
2. **Debugging**: Raw response data দিয়ে problem solve করা যায়
3. **Analytics**: Gateway fees, failure reasons analyze করা যায়
4. **Customer Support**: Customer info দিয়ে support provide করা যায়
5. **Refund Tracking**: Refund history complete track করা যায়
6. **Multi-Currency**: Multiple currencies support করার জন্য ready

---

**Last Updated**: Payment Gateway Implementation
**Version**: 1.0.0

