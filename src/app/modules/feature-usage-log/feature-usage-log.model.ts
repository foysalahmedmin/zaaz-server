import { Schema, model } from 'mongoose';
import {
  FeatureUsageLogModel,
  TFeatureUsageLog,
} from './feature-usage-log.type';

const featureUsageLogSchema = new Schema<
  TFeatureUsageLog,
  FeatureUsageLogModel
>(
  {
    feature_endpoint: {
      type: Schema.Types.ObjectId,
      ref: 'FeatureEndpoint',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
    },
    usage_key: {
      type: String,
    },
    endpoint: {
      type: String,
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    params: {
      type: Schema.Types.Mixed,
    },
    query: {
      type: Schema.Types.Mixed,
    },
    payload: {
      type: Schema.Types.Mixed,
    },
    response: {
      type: Schema.Types.Mixed,
    },
    code: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      required: true,
    },
    type: {
      type: String,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

// Indexes for optimization
featureUsageLogSchema.index({ email: 1 });
featureUsageLogSchema.index({ status: 1 });
featureUsageLogSchema.index({ created_at: -1 }); // Descending for latest logs
featureUsageLogSchema.index({ is_deleted: 1 });
featureUsageLogSchema.index({ user: 1 });
featureUsageLogSchema.index({ feature_endpoint: 1 });

export const FeatureUsageLog = model<TFeatureUsageLog, FeatureUsageLogModel>(
  'FeatureUsageLog',
  featureUsageLogSchema,
);
