import mongoose, { Query, Schema } from 'mongoose';
import {
  TPaymentTransaction,
  TPaymentTransactionDocument,
  TPaymentTransactionModel,
} from './payment-transaction.type';

const paymentTransactionSchema = new Schema<TPaymentTransactionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: [true, 'User is required'],
      index: true,
    },
    user_wallet: {
      type: Schema.Types.ObjectId,
      ref: 'UserWallet',
      required: [true, 'User wallet is required'],
      index: true,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },
    payment_method: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentMethod',
      required: [true, 'Payment method is required'],
    },
    gateway_transaction_id: {
      type: String,
      required: false, // Will be set after gateway response
      trim: true,
      index: true,
      default: '',
    },
    gateway_session_id: {
      type: String,
      trim: true,
      index: true,
    },
    gateway_status: {
      type: String,
      trim: true,
    },
    package: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: [true, 'Package is required'],
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan is required'],
      index: true,
    },
    price: {
      type: Schema.Types.ObjectId,
      ref: 'PackagePlan',
      required: [true, 'Price (package-plan) is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be 0 or greater'],
    },
    currency: {
      type: String,
      enum: ['USD', 'BDT'],
      required: [true, 'Currency is required'],
    },
    gateway_fee: {
      type: Number,
      min: [0, 'Gateway fee must be 0 or greater'],
    },
    failure_reason: {
      type: String,
      trim: true,
    },
    refund_id: {
      type: String,
      trim: true,
    },
    refunded_at: {
      type: Date,
    },
    paid_at: {
      type: Date,
    },
    failed_at: {
      type: Date,
    },
    customer_email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    customer_name: {
      type: String,
      trim: true,
    },
    gateway_response: {
      type: Schema.Types.Mixed,
      select: false, // Don't include in default queries (large data)
    },
    is_deleted: { type: Boolean, default: false, select: false },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// toJSON override to remove sensitive fields from output
paymentTransactionSchema.methods.toJSON = function () {
  const paymentTransaction = this.toObject();
  delete paymentTransaction.is_deleted;
  return paymentTransaction;
};

paymentTransactionSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<
    TPaymentTransaction,
    TPaymentTransaction
  >;
  const opts = query.getOptions();

  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({
      ...query.getQuery(),
      is_deleted: { $ne: true },
    });
  }

  next();
});

// Aggregation pipeline
paymentTransactionSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

export const PaymentTransaction = mongoose.model<
  TPaymentTransactionDocument,
  TPaymentTransactionModel
>('PaymentTransaction', paymentTransactionSchema);
