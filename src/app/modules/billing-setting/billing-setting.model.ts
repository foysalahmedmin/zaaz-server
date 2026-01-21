import mongoose, { Query, Schema } from 'mongoose';
import {
  TBillingSetting,
  TBillingSettingDocument,
  TBillingSettingModel,
} from './billing-setting.type';

const billingSettingSchema = new Schema<TBillingSettingDocument>(
  {
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
billingSettingSchema.methods.toJSON = function () {
  const billingSetting = this.toObject();
  delete billingSetting.is_deleted;
  return billingSetting;
};

billingSettingSchema.statics.isBillingSettingExist = async function (
  id: string,
) {
  return await this.findOne({ _id: id, is_deleted: { $ne: true } });
};

billingSettingSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  this.is_active = false;
  return await this.save();
};

billingSettingSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TBillingSetting, TBillingSetting>;
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
billingSettingSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

export const BillingSetting = mongoose.model<
  TBillingSettingDocument,
  TBillingSettingModel
>('BillingSetting', billingSettingSchema);
