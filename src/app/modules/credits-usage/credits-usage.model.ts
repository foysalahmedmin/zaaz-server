import { Schema, model } from 'mongoose';
import { CreditsUsageModel, TCreditsUsage } from './credits-usage.type';

const creditsUsageSchema = new Schema<TCreditsUsage, CreditsUsageModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    email: {
      type: String,
    },
    user_wallet: {
      type: Schema.Types.ObjectId,
      ref: 'UserWallet',
      required: true,
    },
    feature_endpoint: {
      type: Schema.Types.ObjectId,
      ref: 'FeatureEndpoint',
    },
    credits_transaction: {
      type: Schema.Types.ObjectId,
      ref: 'CreditsTransaction',
      required: true,
    },
    usage_key: {
      type: String,
      index: true,
    },
    credit_price: {
      type: Number,
    },
    ai_model: {
      type: String,
    },
    input_tokens: {
      type: Number,
    },
    output_tokens: {
      type: Number,
    },
    input_credits: {
      type: Number,
    },
    output_credits: {
      type: Number,
    },
    input_token_price: {
      type: Number,
    },
    output_token_price: {
      type: Number,
    },
    profit_credits_percentage: {
      type: Number,
    },
    profit_credits: {
      type: Number,
    },
    cost_credits: {
      type: Number,
    },
    cost_price: {
      type: Number,
      select: false,
    },
    credits: {
      type: Number,
    },
    price: {
      type: Number,
    },
    rounding_credits: {
      type: Number,
    },
    rounding_price: {
      type: Number,
    },
    is_active: {
      type: Boolean,
      default: true,
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
creditsUsageSchema.index({ usage_key: 1 });
creditsUsageSchema.index({ email: 1 });
creditsUsageSchema.index({ ai_model: 1 });
creditsUsageSchema.index({ created_at: -1 });
creditsUsageSchema.index({ user: 1 });
creditsUsageSchema.index({ is_deleted: 1 });

export const CreditsUsage = model<TCreditsUsage, CreditsUsageModel>(
  'CreditsUsage',
  creditsUsageSchema,
);
