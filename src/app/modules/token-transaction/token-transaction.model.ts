import mongoose, { Query, Schema } from 'mongoose';
import {
  TTokenTransaction,
  TTokenTransactionDocument,
  TTokenTransactionModel,
} from './token-transaction.type';

const tokenTransactionSchema = new Schema<TTokenTransactionDocument>(
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
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: ['increase', 'decrease'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be 0 or greater'],
    },
    increase_source: {
      type: String,
      enum: ['payment', 'bonus'],
      validate: {
        validator: function (this: TTokenTransactionDocument, value: string) {
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
        validator: function (this: TTokenTransactionDocument, value: any) {
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
        validator: function (this: TTokenTransactionDocument, value: any) {
          if (
            this.type === 'increase' &&
            this.increase_source === 'payment'
          ) {
            return !!value;
          }
          return !value;
        },
        message:
          'payment_transaction is required when type is increase and increase_source is payment',
      },
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
tokenTransactionSchema.methods.toJSON = function () {
  const tokenTransaction = this.toObject();
  delete tokenTransaction.is_deleted;
  return tokenTransaction;
};

tokenTransactionSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<
    TTokenTransaction,
    TTokenTransaction
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
tokenTransactionSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

export const TokenTransaction = mongoose.model<
  TTokenTransactionDocument,
  TTokenTransactionModel
>('TokenTransaction', tokenTransactionSchema);

