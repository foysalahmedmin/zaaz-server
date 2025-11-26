import mongoose, { Query, Schema } from 'mongoose';
import { TPlan, TPlanDocument, TPlanModel } from './plan.type';

const planSchema = new Schema<TPlanDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 day'],
      index: true,
    },
    sequence: {
      type: Number,
      default: 0,
      min: [0, 'Sequence must be 0 or greater'],
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
planSchema.index({ is_active: 1, is_deleted: 1 });
planSchema.index({ duration: 1 });

// toJSON override to remove sensitive fields from output
planSchema.methods.toJSON = function () {
  const plan = this.toObject();
  delete plan.is_deleted;
  return plan;
};

planSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TPlan, TPlan>;
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
planSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

// Static methods
planSchema.statics.isPlanExist = async function (_id: string) {
  return await this.findById(_id);
};

// Instance methods
planSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const Plan = mongoose.model<TPlanDocument, TPlanModel>(
  'Plan',
  planSchema,
);
