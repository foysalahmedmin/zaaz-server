import mongoose, { Query, Schema } from 'mongoose';
import {
  TUserWallet,
  TUserWalletDocument,
  TUserWalletModel,
} from './user-wallet.type';

const userWalletSchema = new Schema<TUserWalletDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: [true, 'User is required'],
      unique: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    credits: {
      type: Number,
      required: [true, 'Credits is required'],
      min: [0, 'Credits must be 0 or greater'],
    },
    initial_credits_given: {
      type: Boolean,
      default: false,
    },
    initial_package_given: {
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

userWalletSchema.index({ created_at: -1 });

// toJSON override to remove sensitive fields from output
userWalletSchema.methods.toJSON = function () {
  const userWallet = this.toObject();
  delete userWallet.is_deleted;
  return userWallet;
};

userWalletSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TUserWallet, TUserWallet>;
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
userWalletSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

export const UserWallet = mongoose.model<TUserWalletDocument, TUserWalletModel>(
  'UserWallet',
  userWalletSchema,
);


