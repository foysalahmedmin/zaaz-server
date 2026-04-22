import mongoose, { Query, Schema } from 'mongoose';
import {
  TPackagePrice,
  TPackagePriceDocument,
  TPackagePriceModel,
} from './package-price.type';

const packagePriceSchema = new Schema<TPackagePriceDocument>(
  {
    interval: {
      type: Schema.Types.ObjectId,
      ref: 'Interval',
      required: [true, 'Interval is required'],
      index: true,
    },
    package: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: [true, 'Package is required'],
      index: true,
    },
    previous_price: {
      type: Number,
      min: [0, 'Previous price must be 0 or greater'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be 0 or greater'],
    },
    credits: {
      type: Number,
      required: [true, 'Credits is required'],
      min: [0, 'Credits must be 0 or greater'],
      index: true,
    },
    is_initial: {
      type: Boolean,
      default: false,
      index: true,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
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

packagePriceSchema.index({ package: 1, interval: 1 }, { unique: true });
packagePriceSchema.index({ package: 1, is_initial: 1, is_active: 1 });
packagePriceSchema.index({ package: 1, is_active: 1, is_deleted: 1 });
packagePriceSchema.index({ interval: 1 });
packagePriceSchema.index({ is_deleted: 1 });
packagePriceSchema.index({ created_at: -1 });

packagePriceSchema.methods.toJSON = function () {
  const packagePrice = this.toObject();
  delete packagePrice.is_deleted;
  return packagePrice;
};

packagePriceSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TPackagePrice, TPackagePrice>;
  const opts = query.getOptions();

  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({
      ...query.getQuery(),
      is_deleted: { $ne: true },
    });
  }

  next();
});

packagePriceSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

packagePriceSchema.statics.isPackagePriceExist = async function (_id: string) {
  return await this.findById(_id);
};

packagePriceSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const PackagePrice = mongoose.model<TPackagePriceDocument, TPackagePriceModel>(
  'PackagePrice',
  packagePriceSchema,
);
