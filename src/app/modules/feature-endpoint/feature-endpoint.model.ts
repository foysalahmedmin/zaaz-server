import mongoose, { Query, Schema } from 'mongoose';
import {
  TFeatureEndpoint,
  TFeatureEndpointDocument,
  TFeatureEndpointModel,
} from './feature-endpoint.type';

const featureEndpointSchema = new Schema<TFeatureEndpointDocument>(
  {
    feature: {
      type: Schema.Types.ObjectId,
      ref: 'Feature',
      required: [true, 'Feature is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    value: {
      type: String,
      required: [true, 'Value is required'],
      trim: true,
      lowercase: true,
      minlength: [2, 'Value must be at least 2 characters'],
      maxlength: [100, 'Value cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    endpoint: {
      type: String,
      required: [true, 'Endpoint is required'],
      trim: true,
    },
    method: {
      type: String,
      required: [true, 'Method is required'],
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      uppercase: true,
      index: true,
    },
    min_credits: {
      type: Number,
      required: [true, 'Credits is required'],
      min: [0, 'Credits must be 0 or greater'],
    },
    sequence: {
      type: Number,
      default: 0,
      min: [0, 'Sequence must be 0 or greater'],
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

featureEndpointSchema.index({ created_at: -1 });
featureEndpointSchema.index({ is_active: 1 });
featureEndpointSchema.index({ is_deleted: 1 });

// Compound unique index: feature + endpoint + method (only for non-deleted records)
featureEndpointSchema.index(
  { feature: 1, endpoint: 1, method: 1 },
  {
    unique: true,
    partialFilterExpression: { is_deleted: { $ne: true } },
    name: 'feature_endpoint_method_unique',
  },
);

// Unique index for value field (only for non-deleted records)
featureEndpointSchema.index(
  { value: 1 },
  {
    unique: true,
    partialFilterExpression: { is_deleted: { $ne: true } },
    name: 'value_unique',
  },
);

// toJSON override to remove sensitive fields from output
featureEndpointSchema.methods.toJSON = function () {
  const featureEndpoint = this.toObject();
  delete featureEndpoint.is_deleted;
  return featureEndpoint;
};

featureEndpointSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TFeatureEndpoint, TFeatureEndpoint>;
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
featureEndpointSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

// Static methods
featureEndpointSchema.statics.isFeatureEndpointExist = async function (
  _id: string,
) {
  return await this.findById(_id);
};

// Instance methods
featureEndpointSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const FeatureEndpoint = mongoose.model<
  TFeatureEndpointDocument,
  TFeatureEndpointModel
>('FeatureEndpoint', featureEndpointSchema);
