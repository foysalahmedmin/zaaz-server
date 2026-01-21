import mongoose, { Query, Schema } from 'mongoose';
import {
  TPackagePlan,
  TPackagePlanDocument,
  TPackagePlanModel,
} from './package-plan.type';

const packagePlanSchema = new Schema<TPackagePlanDocument>(
  {
    plan: {
      type: Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan is required'],
      index: true,
    },
    package: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: [true, 'Package is required'],
      index: true,
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

// Indexes
packagePlanSchema.index({ package: 1, plan: 1 }, { unique: true });
packagePlanSchema.index({ package: 1, is_initial: 1, is_active: 1 });
packagePlanSchema.index({ package: 1, is_active: 1, is_deleted: 1 });
packagePlanSchema.index({ plan: 1 });
packagePlanSchema.index({ is_deleted: 1 });
packagePlanSchema.index({ created_at: -1 });

// toJSON override to remove sensitive fields from output
packagePlanSchema.methods.toJSON = function () {
  const packagePlan = this.toObject();
  delete packagePlan.is_deleted;
  return packagePlan;
};

packagePlanSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TPackagePlan, TPackagePlan>;
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
packagePlanSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

// Static methods
packagePlanSchema.statics.isPackagePlanExist = async function (_id: string) {
  return await this.findById(_id);
};

// Instance methods
packagePlanSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const PackagePlan = mongoose.model<
  TPackagePlanDocument,
  TPackagePlanModel
>('PackagePlan', packagePlanSchema);
