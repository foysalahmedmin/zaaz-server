import mongoose, { Query, Schema } from 'mongoose';
import {
  TFeatureFeedback,
  TFeatureFeedbackDocument,
  TFeatureFeedbackModel,
} from './feature-feedback.type';

const featureFeedbackSchema = new Schema<TFeatureFeedbackDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    feature: {
      type: Schema.Types.ObjectId,
      ref: 'Feature',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['suggestion', 'bug', 'compliment', 'other'],
      default: 'suggestion',
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending',
    },
    admin_note: {
      type: String,
      trim: true,
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

featureFeedbackSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TFeatureFeedback, TFeatureFeedback>;
  const opts = query.getOptions();

  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({
      ...query.getQuery(),
      is_deleted: { $ne: true },
    });
  }

  next();
});

featureFeedbackSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const FeatureFeedback = mongoose.model<
  TFeatureFeedbackDocument,
  TFeatureFeedbackModel
>('FeatureFeedback', featureFeedbackSchema);
