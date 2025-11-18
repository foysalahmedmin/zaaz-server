import mongoose, { Query, Schema } from 'mongoose';
import { TFeature, TFeatureDocument, TFeatureModel } from './feature.type';

const featureSchema = new Schema<TFeatureDocument>(
  {
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Feature',
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    path: {
      type: String,
      trim: true,
      maxlength: [200, 'Path cannot exceed 200 characters'],
    },
    prefix: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['writing', 'generation', 'other'],
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

// Virtual field for children
featureSchema.virtual('children', {
  ref: 'Feature',
  localField: '_id',
  foreignField: 'parent',
  match: { is_deleted: { $ne: true } },
});

// toJSON override to remove sensitive fields from output
featureSchema.methods.toJSON = function () {
  const feature = this.toObject();
  delete feature.is_deleted;
  return feature;
};

featureSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TFeature, TFeature>;
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
featureSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

// Static methods
featureSchema.statics.isFeatureExist = async function (_id: string) {
  return await this.findById(_id);
};

// Instance methods
featureSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const Feature = mongoose.model<TFeatureDocument, TFeatureModel>(
  'Feature',
  featureSchema,
);
