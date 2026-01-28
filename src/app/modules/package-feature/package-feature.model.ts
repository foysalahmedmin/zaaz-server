import mongoose, { Query, Schema } from 'mongoose';
import {
  TPackageFeature,
  TPackageFeatureDocument,
  TPackageFeatureModel,
} from './package-feature.type';

const packageFeatureSchema = new Schema<TPackageFeatureDocument>(
  {
    package: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: [true, 'Package is required'],
      index: true,
    },
    feature: {
      type: Schema.Types.ObjectId,
      ref: 'Feature',
      required: [true, 'Feature is required'],
      index: true,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    sequence: {
      type: Number,
      default: 0,
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
packageFeatureSchema.index({ package: 1, feature: 1 }, { unique: true });
packageFeatureSchema.index({ package: 1, is_active: 1 });
packageFeatureSchema.index({ is_deleted: 1 });

packageFeatureSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TPackageFeature, TPackageFeature>;
  const opts = query.getOptions();

  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({
      ...query.getQuery(),
      is_deleted: { $ne: true },
    });
  }
  next();
});

export const PackageFeature = mongoose.model<
  TPackageFeatureDocument,
  TPackageFeatureModel
>('PackageFeature', packageFeatureSchema);
