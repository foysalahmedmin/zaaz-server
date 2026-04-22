import mongoose, { Query, Schema } from 'mongoose';
import {
  TUserSubscription,
  TUserSubscriptionDocument,
  TUserSubscriptionModel,
} from './user-subscription.type';

const userSubscriptionSchema = new Schema<TUserSubscriptionDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    package: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: [true, 'Package is required'],
      index: true,
    },
    package_snapshot: {
      type: Schema.Types.ObjectId,
      ref: 'PackageHistory',
      required: [true, 'Package snapshot is required'],
      index: true,
    },
    interval: {
      type: Schema.Types.ObjectId,
      ref: 'Interval',
      required: [true, 'Interval is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['trialing', 'active', 'past_due', 'canceled', 'expired'],
      default: 'active',
      index: true,
    },
    current_period_start: {
      type: Date,
      required: true,
    },
    current_period_end: {
      type: Date,
      required: true,
      index: true,
    },
    cancel_at_period_end: {
      type: Boolean,
      default: false,
    },
    auto_renew: {
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

userSubscriptionSchema.index({ created_at: -1 });

// toJSON override to remove sensitive fields from output
userSubscriptionSchema.methods.toJSON = function () {
  const userSubscription = this.toObject();
  delete userSubscription.is_deleted;
  return userSubscription;
};

userSubscriptionSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TUserSubscription, TUserSubscription>;
  const opts = query.getOptions();
  const currentQuery = query.getQuery();

  const newQuery: any = { ...currentQuery };

  // Add is_deleted filter
  if (!opts?.bypassDeleted && currentQuery.is_deleted === undefined) {
    newQuery.is_deleted = { $ne: true };
  }

  query.setQuery(newQuery);
  next();
});

// Aggregation pipeline
userSubscriptionSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

export const UserSubscription = mongoose.model<
  TUserSubscriptionDocument,
  TUserSubscriptionModel
>('UserSubscription', userSubscriptionSchema);
