import mongoose, { Query, Schema } from 'mongoose';
import {
  TNotification,
  TNotificationDocument,
  TNotificationModel,
} from './notification.type';

const notificationSchema = new Schema<TNotificationDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: ['request', 'approval'],
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },

    channels: {
      type: [String],
      enum: ['web', 'push', 'email'],
      required: true,
    },

    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    expires_at: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },

    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
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

// toJSON override to remove sensitive fields from output
notificationSchema.methods.toJSON = function () {
  const category = this.toObject();
  delete category.is_deleted;
  return category;
};

// Query middleware to exclude deleted categories
notificationSchema.pre(
  /^find/,
  function (this: Query<TNotification, TNotification>, next) {
    this.setQuery({
      ...this.getQuery(),
      is_deleted: { $ne: true },
    });
    next();
  },
);

notificationSchema.pre(
  /^update/,
  function (this: Query<TNotification, TNotification>, next) {
    this.setQuery({
      ...this.getQuery(),
      is_deleted: { $ne: true },
    });
    next();
  },
);

// Aggregation pipeline
notificationSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

// Static methods
notificationSchema.statics.isCategoryExist = async function (_id: string) {
  return await this.findById(_id);
};

// Instance methods
notificationSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const Notification = mongoose.model<
  TNotificationDocument,
  TNotificationModel
>('Notification', notificationSchema);
