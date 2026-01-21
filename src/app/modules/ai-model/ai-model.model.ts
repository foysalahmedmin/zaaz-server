import mongoose, { Query, Schema } from 'mongoose';
import { TAiModel, TAiModelDocument, TAiModelModel } from './ai-model.type';

const aiModelSchema = new Schema<TAiModelDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      trim: true,
    },
    value: {
      type: String,
      required: [true, 'Value is required'],
      unique: true,
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
      min: [0, 'Input token price must be a non-negative number'],
    },
    output_token_price: {
      type: Number,
      required: [true, 'Output token price is required'],
      min: [0, 'Output token price must be a non-negative number'],
    },
    currency: {
      type: String,
      enum: ['USD'],
      default: 'USD',
      required: [true, 'Currency is required'],
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    is_initial: {
      type: Boolean,
      default: false,
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
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        delete (ret as any).is_deleted;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

// Indexes
aiModelSchema.index({ value: 1 }, { unique: true });
aiModelSchema.index({ is_active: 1 });
aiModelSchema.index({ is_deleted: 1 });

// Query Middleware
aiModelSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TAiModel, TAiModel>;
  if (query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

aiModelSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

// Static methods
aiModelSchema.statics.isAiModelExist = async function (_id: string) {
  return await this.findById(_id);
};

aiModelSchema.statics.isAiModelExistByValue = async function (value: string) {
  return await this.findOne({ value });
};

// Instance methods
aiModelSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const AiModel = mongoose.model<TAiModelDocument, TAiModelModel>(
  'AiModel',
  aiModelSchema,
);
