import mongoose, { Query, Schema } from 'mongoose';
import {
  TPackageFeatureConfig,
  TPackageFeatureConfigDocument,
  TPackageFeatureConfigModel,
} from './package-feature-config.type';

const packageFeatureConfigSchema = new Schema<TPackageFeatureConfigDocument>(
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
      default: null,
      index: true,
    },
    feature_endpoint: {
      type: Schema.Types.ObjectId,
      ref: 'FeatureEndpoint',
      default: null,
      index: true,
    },
    config: {
      type: Schema.Types.Mixed,
      required: [true, 'Config is required'],
      default: {},
    },
    description: {
      type: String,
      trim: true,
    },
    sequence: {
      type: Number,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
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
// Unique constraint: One config per package-feature-endpoint combination
packageFeatureConfigSchema.index(
  { package: 1, feature: 1, feature_endpoint: 1 },
  { unique: true },
);

// Query optimization indexes
packageFeatureConfigSchema.index({ package: 1, is_active: 1 });
packageFeatureConfigSchema.index({ feature: 1, is_active: 1 });
packageFeatureConfigSchema.index({ is_deleted: 1 });

// Validation: At least one of feature or feature_endpoint must be provided
packageFeatureConfigSchema.pre('validate', function (next) {
  if (!this.feature && !this.feature_endpoint) {
    next(
      new Error('At least one of feature or feature_endpoint must be provided'),
    );
  } else {
    next();
  }
});

// toJSON override to remove sensitive fields from output
packageFeatureConfigSchema.methods.toJSON = function () {
  const config = this.toObject();
  delete config.is_deleted;
  return config;
};

// Soft delete method
packageFeatureConfigSchema.methods.softDelete =
  async function (): Promise<TPackageFeatureConfigDocument | null> {
    this.is_deleted = true;
    return await this.save();
  };

// Pre-find middleware to exclude soft-deleted documents
packageFeatureConfigSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<
    TPackageFeatureConfig,
    TPackageFeatureConfig
  >;
  const opts = query.getOptions();

  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({
      ...query.getQuery(),
      is_deleted: { $ne: true },
    });
  }

  next();
});

// Aggregation pipeline middleware
packageFeatureConfigSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

// Static method to check if config exists
packageFeatureConfigSchema.statics.isPackageFeatureConfigExist =
  async function (_id: string): Promise<TPackageFeatureConfigDocument | null> {
    return await this.findById(_id).lean();
  };

export const PackageFeatureConfig = mongoose.model<
  TPackageFeatureConfigDocument,
  TPackageFeatureConfigModel
>('PackageFeatureConfig', packageFeatureConfigSchema);
