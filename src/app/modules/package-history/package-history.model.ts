import mongoose, { Query, Schema } from 'mongoose';
import {
  TPackageHistory,
  TPackageHistoryDocument,
  TPackageHistoryModel,
} from './package-history.type';

const packageHistorySchema = new Schema<TPackageHistoryDocument>(
  {
    package: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: [true, 'Package is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      trim: true,
    },
    token: {
      type: Number,
      required: [true, 'Token is required'],
      min: [0, 'Token must be 0 or greater'],
    },
    features: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Feature',
        required: true,
      },
    ],
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 day'],
    },
    price: {
      USD: {
        type: Number,
        required: [true, 'Price USD is required'],
        min: [0, 'Price USD must be 0 or greater'],
      },
      BDT: {
        type: Number,
        required: [true, 'Price BDT is required'],
        min: [0, 'Price BDT must be 0 or greater'],
      },
    },
    previous_price: {
      USD: {
        type: Number,
        min: [0, 'Previous price USD must be 0 or greater'],
      },
      BDT: {
        type: Number,
        min: [0, 'Previous price BDT must be 0 or greater'],
      },
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

// toJSON override to remove sensitive fields from output
packageHistorySchema.methods.toJSON = function () {
  const packageHistory = this.toObject();
  delete packageHistory.is_deleted;
  return packageHistory;
};

packageHistorySchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<
    TPackageHistory,
    TPackageHistory
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
packageHistorySchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

export const PackageHistory = mongoose.model<
  TPackageHistoryDocument,
  TPackageHistoryModel
>('PackageHistory', packageHistorySchema);

