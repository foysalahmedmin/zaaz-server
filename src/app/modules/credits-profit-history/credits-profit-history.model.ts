import mongoose, { Query, Schema } from 'mongoose';
import {
  TCreditsProfitHistory,
  TCreditsProfitHistoryDocument,
  TCreditsProfitHistoryModel,
} from './credits-profit-history.type';

const creditsProfitHistorySchema = new Schema<TCreditsProfitHistoryDocument>(
  {
    credits_profit: {
      type: Schema.Types.ObjectId,
      ref: 'CreditsProfit',
      required: [true, 'Credits profit is required'],
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
creditsProfitHistorySchema.methods.toJSON = function () {
  const creditsProfitHistory = this.toObject();
  delete creditsProfitHistory.is_deleted;
  return creditsProfitHistory;
};

creditsProfitHistorySchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<
    TCreditsProfitHistory,
    TCreditsProfitHistory
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
creditsProfitHistorySchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

export const CreditsProfitHistory = mongoose.model<
  TCreditsProfitHistoryDocument,
  TCreditsProfitHistoryModel
>('CreditsProfitHistory', creditsProfitHistorySchema);
