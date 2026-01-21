import mongoose, { Query, Schema } from 'mongoose';
import {
  TAiModelHistory,
  TAiModelHistoryDocument,
  TAiModelHistoryModel,
} from './ai-model-history.type';

const aiModelHistorySchema = new Schema<TAiModelHistoryDocument>(
  {
    ai_model: {
      type: Schema.Types.ObjectId,
      ref: 'AiModel',
      required: [true, 'AI Model is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    value: {
      type: String,
      required: [true, 'Value is required'],
      trim: true,
      lowercase: true,
    },
    provider: {
      type: String,
      required: [true, 'Provider is required'],
      trim: true,
    },
    input_token_price: {
      type: Number,
      required: [true, 'Input token price is required'],
      min: 0,
    },
    output_token_price: {
      type: Number,
      required: [true, 'Output token price is required'],
      min: 0,
    },
    currency: {
      type: String,
      enum: ['USD'],
      default: 'USD',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_initial: {
      type: Boolean,
      default: false,
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

// toJSON override to remove sensitive fields from output
aiModelHistorySchema.methods.toJSON = function () {
  const history = this.toObject();
  delete history.is_deleted;
  return history;
};

aiModelHistorySchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TAiModelHistory, TAiModelHistory>;
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
aiModelHistorySchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

export const AiModelHistory = mongoose.model<
  TAiModelHistoryDocument,
  TAiModelHistoryModel
>('AiModelHistory', aiModelHistorySchema);
