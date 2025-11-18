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
    package: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: [true, 'Package is required'],
    },
    token: {
      type: Number,
      required: [true, 'Token is required'],
      min: [0, 'Token must be 0 or greater'],
    },
    expires_at: {
      type: Date,
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

// toJSON override
userWalletSchema.methods.toJSON = function () {
  const userWallet = this.toObject();
  return userWallet;
};

userWalletSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TUserWallet, TUserWallet>;
  const opts = query.getOptions();

  // Check if wallet is expired
  if (!opts?.bypassExpired) {
    query.setQuery({
      ...query.getQuery(),
      $or: [
        { expires_at: { $exists: false } },
        { expires_at: { $gte: new Date() } },
      ],
    });
  }

  next();
});

export const UserWallet = mongoose.model<
  TUserWalletDocument,
  TUserWalletModel
>('UserWallet', userWalletSchema);

