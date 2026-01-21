import mongoose, { Query, Schema } from 'mongoose';
import {
  TFeaturePopup,
  TFeaturePopupDocument,
  TFeaturePopupModel,
} from './feature-popup.type';

const featurePopupActionSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Action name is required'],
      trim: true,
      minlength: [2, 'Action name must be at least 2 characters'],
      maxlength: [100, 'Action name cannot exceed 100 characters'],
    },
    path: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['link', 'other'],
      default: 'link',
    },
    variant: {
      type: String,
      enum: [
        'default',
        'primary',
        'secondary',
        'outline',
        'destructive',
        'link',
      ],
      default: 'default',
    },
    size: {
      type: String,
      enum: ['full', 'default', 'sm', 'lg', 'icon', 'icon-sm', 'icon-lg'],
      default: 'default',
    },
    position: {
      type: String,
      enum: ['header', 'footer', 'content'],
      default: 'content',
    },
  },
  { _id: false },
);

const featurePopupSchema = new Schema<TFeaturePopupDocument>(
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
    image: {
      type: String,
      trim: true,
    },
    video: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      trim: true,
    },
    actions: {
      type: [featurePopupActionSchema],
      default: [],
    },
    category: {
      type: String,
      enum: ['single-time', 'multi-time'],
      default: 'single-time',
    },
    priority: {
      type: Number,
      default: 0,
      index: true,
    },
    size: {
      type: String,
      enum: ['sm', 'md', 'lg', 'xl', 'full'],
      default: 'md',
    },
    delay: {
      type: Number,
      default: 0,
      min: 0,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
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

// toJSON override to remove sensitive fields from output
featurePopupSchema.methods.toJSON = function () {
  const popup = this.toObject();
  delete popup.is_deleted;
  return popup;
};

// Pre-find hook to filter deleted records
featurePopupSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TFeaturePopup, TFeaturePopup>;
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
featurePopupSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

// Indexes
featurePopupSchema.index({ created_at: -1 });
featurePopupSchema.index({ feature: 1 });
featurePopupSchema.index({ feature: 1, is_active: 1, is_deleted: 1 });
featurePopupSchema.index({ category: 1, is_active: 1 });
featurePopupSchema.index({ is_deleted: 1 });
featurePopupSchema.index({ priority: -1 }); // Descending for sorting by priority

// Unique index for value field (only for non-deleted records)
featurePopupSchema.index(
  { value: 1 },
  {
    unique: true,
    partialFilterExpression: { is_deleted: { $ne: true } },
    name: 'feature_popup_value_unique',
  },
);

// Static methods
featurePopupSchema.statics.isFeaturePopupExist = async function (
  _id: string,
): Promise<TFeaturePopupDocument | null> {
  return await this.findById(_id);
};

// Instance methods
featurePopupSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const FeaturePopup = mongoose.model<
  TFeaturePopupDocument,
  TFeaturePopupModel
>('FeaturePopup', featurePopupSchema);
