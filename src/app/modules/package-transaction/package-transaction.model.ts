import mongoose, { Query, Schema } from 'mongoose';
import {
  TPackageTransaction,
  TPackageTransactionDocument,
  TPackageTransactionModel,
} from './package-transaction.type';

const packageTransactionSchema = new Schema<TPackageTransactionDocument>(
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
    package: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: [true, 'Package is required'],
      index: true,
    },
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan is required'],
      index: true,
    },
    credits: {
      type: Number,
      required: [true, 'Credits is required'],
      min: [0, 'Credits must be 0 or greater'],
    },
    increase_source: {
      type: String,
      enum: ['payment', 'bonus'],
      required: [true, 'Increase source is required'],
    },
    payment_transaction: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentTransaction',
    },
    is_active: {
      type: Boolean,
      default: true,
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

packageTransactionSchema.index({ created_at: -1 });
packageTransactionSchema.index({ increase_source: 1 });
packageTransactionSchema.index({ is_deleted: 1 });

// toJSON override to remove sensitive fields from output
packageTransactionSchema.methods.toJSON = function () {
  const packageTransaction = this.toObject();
  delete packageTransaction.is_deleted;
  return packageTransaction;
};

packageTransactionSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<
    TPackageTransaction,
    TPackageTransaction
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
packageTransactionSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

export const PackageTransaction = mongoose.model<
  TPackageTransactionDocument,
  TPackageTransactionModel
>('PackageTransaction', packageTransactionSchema);
