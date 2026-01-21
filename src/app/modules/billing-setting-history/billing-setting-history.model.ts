import mongoose, { Query, Schema } from 'mongoose';
import {
  TBillingSettingHistory,
  TBillingSettingHistoryDocument,
  TBillingSettingHistoryModel,
} from './billing-setting-history.type';

const billingSettingHistorySchema = new Schema<TBillingSettingHistoryDocument>(
  {
    billing_setting: {
      type: Schema.Types.ObjectId,
      ref: 'BillingSetting',
      required: [true, 'Billing Setting is required'],
    },
    credit_price: {
      type: Number,
      required: [true, 'Credit price is required'],
      min: 0,
    },
    currency: {
      type: String,
      enum: ['USD'],
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    applied_at: {
      type: Date,
      default: Date.now,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_initial: {
      type: Boolean,
      default: false,
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
billingSettingHistorySchema.methods.toJSON = function () {
  const history = this.toObject();
  delete history.is_deleted;
  return history;
};

billingSettingHistorySchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<
    TBillingSettingHistory,
    TBillingSettingHistory
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
billingSettingHistorySchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

export const BillingSettingHistory = mongoose.model<
  TBillingSettingHistoryDocument,
  TBillingSettingHistoryModel
>('BillingSettingHistory', billingSettingHistorySchema);
