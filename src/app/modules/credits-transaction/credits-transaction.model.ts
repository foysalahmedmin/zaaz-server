import mongoose, { Query, Schema } from 'mongoose';
import {
  TCreditsTransaction,
  TCreditsTransactionDocument,
  TCreditsTransactionModel,
} from './credits-transaction.type';

const creditsTransactionSchema = new Schema<TCreditsTransactionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: [true, 'User is required'],
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    user_wallet: {
      type: Schema.Types.ObjectId,
      ref: 'UserWallet',
      required: [true, 'User wallet is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: ['increase', 'decrease'],
    },
    credits: {
      type: Number,
      required: [true, 'Credits is required'],
      min: [0, 'Credits must be 0 or greater'],
    },
    increase_source: {
      type: String,
      enum: ['payment', 'bonus'],
      validate: {
        validator: function (this: TCreditsTransactionDocument, value: string) {
          if (this.type === 'increase') {
            return !!value;
          }
          return !value;
        },
        message: 'increase_source is required when type is increase',
      },
    },
    decrease_source: {
      type: Schema.Types.ObjectId,
      ref: 'FeatureEndpoint',
      validate: {
        validator: function (this: TCreditsTransactionDocument, value: any) {
          if (this.type === 'decrease') {
            return !!value;
          }
          return !value;
        },
        message: 'decrease_source is required when type is decrease',
      },
    },
    payment_transaction: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentTransaction',
      validate: {
        validator: function (this: TCreditsTransactionDocument, value: any) {
          if (this.type === 'increase' && this.increase_source === 'payment') {
            return !!value;
          }
          return !value;
        },
        message:
          'payment_transaction is required when type is increase and increase_source is payment',
      },
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      index: true,
    },
    usage_key: {
      type: String,
      index: true,
    },
    is_active: {
      type: Boolean,
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

creditsTransactionSchema.index({ created_at: -1 });
creditsTransactionSchema.index({ type: 1 });
creditsTransactionSchema.index({ increase_source: 1 });
creditsTransactionSchema.index({ is_deleted: 1 });

// toJSON override to remove sensitive fields from output
creditsTransactionSchema.methods.toJSON = function () {
  const creditsTransaction = this.toObject();
  delete creditsTransaction.is_deleted;
  return creditsTransaction;
};

creditsTransactionSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<
    TCreditsTransaction,
    TCreditsTransaction
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
creditsTransactionSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

export const CreditsTransaction = mongoose.model<
  TCreditsTransactionDocument,
  TCreditsTransactionModel
>('CreditsTransaction', creditsTransactionSchema);
