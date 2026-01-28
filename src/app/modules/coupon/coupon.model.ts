import mongoose, { Query, Schema } from 'mongoose';
import { TCoupon, TCouponDocument, TCouponModel } from './coupon.type';

const couponSchema = new Schema<TCouponDocument>(
  {
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      trim: true,
    },
    discount_type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: [true, 'Discount type is required'],
    },
    discount_value: {
      type: Number,
      default: 0,
    },
    fixed_amount: {
      USD: { type: Number, default: 0 },
      BDT: { type: Number, default: 0 },
    },
    min_purchase_amount: {
      USD: { type: Number, default: 0 },
      BDT: { type: Number, default: 0 },
    },
    max_discount_amount: {
      USD: { type: Number, default: 0 },
      BDT: { type: Number, default: 0 },
    },
    valid_from: {
      type: Date,
    },
    valid_until: {
      type: Date,
    },
    usage_limit: {
      type: Number,
    },
    usage_count: {
      type: Number,
      default: 0,
    },
    applicable_packages: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Package',
      },
    ],
    is_active: {
      type: Boolean,
      default: true,
    },
    is_affiliate: {
      type: Boolean,
      default: false,
    },
    is_deleted: {
      type: Boolean,
      default: false,
      select: false,
    },
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

// Indexes
couponSchema.index({ code: 1 }, { unique: true });
couponSchema.index({ is_active: 1 });
couponSchema.index({ is_affiliate: 1 });
couponSchema.index({ is_deleted: 1 });
couponSchema.index({ valid_until: 1 });

// Soft delete middleware
couponSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TCoupon, TCoupon>;
  //@ts-ignore
  const opts = query.getOptions();

  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({
      ...query.getQuery(),
      is_deleted: { $ne: true },
    });
  }

  next();
});

couponSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

// Static methods
couponSchema.statics.isCouponExist = async function (
  code: string,
  options?: Record<string, any>,
) {
  return await this.findOne({ code }).setOptions(options);
};

// Instance methods
couponSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const Coupon = mongoose.model<TCouponDocument, TCouponModel>(
  'Coupon',
  couponSchema,
);
