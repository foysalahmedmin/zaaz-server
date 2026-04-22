import mongoose, { Query, Schema } from 'mongoose';
import { TInterval, TIntervalDocument, TIntervalModel } from './interval.type';

const intervalSchema = new Schema<TIntervalDocument>(
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

intervalSchema.index({ is_active: 1, is_deleted: 1 });
intervalSchema.index({ duration: 1 });
intervalSchema.index({ created_at: -1 });

intervalSchema.methods.toJSON = function () {
  const interval = this.toObject();
  delete interval.is_deleted;
  return interval;
};

intervalSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TInterval, TInterval>;
  const opts = query.getOptions();

  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({
      ...query.getQuery(),
      is_deleted: { $ne: true },
    });
  }

  next();
});

intervalSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

intervalSchema.statics.isIntervalExist = async function (_id: string) {
  return await this.findById(_id);
};

intervalSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const Interval = mongoose.model<TIntervalDocument, TIntervalModel>(
  'Interval',
  intervalSchema,
);
