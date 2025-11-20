import mongoose, { Query, Schema } from 'mongoose';
import {
  TNotificationAction,
  TNotificationMetadata,
  TNotificationRecipient,
  TNotificationRecipientDocument,
  TNotificationRecipientModel,
} from './notification-recipient.type';

const notificationActionSchema = new Schema<TNotificationAction>(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false },
);

const notificationMetadataSchema = new Schema<TNotificationMetadata>(
  {
    url: { type: String, trim: true },
    image: { type: String, trim: true },
    source: { type: String, trim: true },
    reference: { type: String, trim: true },
    actions: { type: [notificationActionSchema], default: [] },
  },
  { _id: false },
);

const notificationRecipientSchema = new Schema<TNotificationRecipientDocument>(
  {
    notification: {
      type: Schema.Types.ObjectId,
      ref: 'Notification',
      required: true,
    },

    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    metadata: {
      type: notificationMetadataSchema,
      default: {},
    },

    is_read: {
      type: Boolean,
      default: false,
    },

    read_at: {
      type: Date,
      default: null,
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

notificationRecipientSchema.index(
  { notification: 1, recipient: 1 },
  { unique: true },
);

// toJSON override to remove sensitive fields from output
notificationRecipientSchema.methods.toJSON = function () {
  const category = this.toObject();
  delete category.is_deleted;
  return category;
};

// Query middleware to exclude deleted categories
notificationRecipientSchema.pre(
  /^find/,
  function (this: Query<TNotificationRecipient, TNotificationRecipient>, next) {
    this.setQuery({
      ...this.getQuery(),
      is_deleted: { $ne: true },
    });
    next();
  },
);

notificationRecipientSchema.pre(
  /^update/,
  function (this: Query<TNotificationRecipient, TNotificationRecipient>, next) {
    this.setQuery({
      ...this.getQuery(),
      is_deleted: { $ne: true },
    });
    next();
  },
);

// Aggregation pipeline
notificationRecipientSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

// Static methods
notificationRecipientSchema.statics.isNotificationRecipientExist =
  async function (_id: string) {
    return await this.findById(_id);
  };

// Instance methods
notificationRecipientSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const NotificationRecipient = mongoose.model<
  TNotificationRecipientDocument,
  TNotificationRecipientModel
>('NotificationRecipient', notificationRecipientSchema);
