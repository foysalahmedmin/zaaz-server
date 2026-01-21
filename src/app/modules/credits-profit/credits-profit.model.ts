import mongoose, { Query, Schema } from 'mongoose';
import {
  TCreditsProfit,
  TCreditsProfitDocument,
  TCreditsProfitModel,
} from './credits-profit.type';

const creditsProfitSchema = new Schema<TCreditsProfitDocument>(
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

creditsProfitSchema.index({ created_at: -1 });
creditsProfitSchema.index({ is_active: 1 });
creditsProfitSchema.index({ is_deleted: 1 });

// toJSON override to remove sensitive fields from output
creditsProfitSchema.methods.toJSON = function () {
  const creditsProfit = this.toObject();
  delete creditsProfit.is_deleted;
  return creditsProfit;
};

creditsProfitSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TCreditsProfit, TCreditsProfit>;
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
creditsProfitSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

// Static methods
creditsProfitSchema.statics.isCreditsProfitExist = async function (
  _id: string,
) {
  return await this.findById(_id);
};

// Instance methods
creditsProfitSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const CreditsProfit = mongoose.model<
  TCreditsProfitDocument,
  TCreditsProfitModel
>('CreditsProfit', creditsProfitSchema);
