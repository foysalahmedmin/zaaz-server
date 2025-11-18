import mongoose, { Query, Schema } from 'mongoose';
import {
  TTokenProfit,
  TTokenProfitDocument,
  TTokenProfitModel,
} from './token-profit.type';

const tokenProfitSchema = new Schema<TTokenProfitDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    percentage: {
      type: Number,
      required: [true, 'Percentage is required'],
      min: [0, 'Percentage must be 0 or greater'],
      max: [100, 'Percentage cannot exceed 100'],
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

// toJSON override to remove sensitive fields from output
tokenProfitSchema.methods.toJSON = function () {
  const tokenProfit = this.toObject();
  delete tokenProfit.is_deleted;
  return tokenProfit;
};

tokenProfitSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TTokenProfit, TTokenProfit>;
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
tokenProfitSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

// Static methods
tokenProfitSchema.statics.isTokenProfitExist = async function (_id: string) {
  return await this.findById(_id);
};

// Instance methods
tokenProfitSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const TokenProfit = mongoose.model<
  TTokenProfitDocument,
  TTokenProfitModel
>('TokenProfit', tokenProfitSchema);

