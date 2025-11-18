import mongoose, { Query, Schema } from 'mongoose';
import {
  TTokenProfitHistory,
  TTokenProfitHistoryDocument,
  TTokenProfitHistoryModel,
} from './token-profit-history.type';

const tokenProfitHistorySchema = new Schema<TTokenProfitHistoryDocument>(
  {
    token_profit: {
      type: Schema.Types.ObjectId,
      ref: 'TokenProfit',
      required: [true, 'Token profit is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    percentage: {
      type: Number,
      required: [true, 'Percentage is required'],
      min: [0, 'Percentage must be 0 or greater'],
      max: [100, 'Percentage cannot exceed 100'],
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
tokenProfitHistorySchema.methods.toJSON = function () {
  const tokenProfitHistory = this.toObject();
  delete tokenProfitHistory.is_deleted;
  return tokenProfitHistory;
};

tokenProfitHistorySchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<
    TTokenProfitHistory,
    TTokenProfitHistory
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
tokenProfitHistorySchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

export const TokenProfitHistory = mongoose.model<
  TTokenProfitHistoryDocument,
  TTokenProfitHistoryModel
>('TokenProfitHistory', tokenProfitHistorySchema);

