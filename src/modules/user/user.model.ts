import bcrypt from 'bcrypt';
import mongoose, { Query, Schema } from 'mongoose';
import config from '../../config/env';
import { TUser, TUserDocument, TUserModel } from './user.type';

const userSchema = new Schema<TUserDocument>(
  {
    image: {
      type: String,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: function (this: TUserDocument) {
        return this.auth_source === 'email';
      },
      minlength: [6, 'the password should minimum 6 character'],
      maxlength: [100, 'the password should maximum 100 character'],
      select: false,
    },
    password_changed_at: { type: Date, default: Date.now, select: false },
    role: {
      type: String,
      enum: [
        'super-admin',
        'admin',
        'editor',
        'author',
        'contributor',
        'subscriber',
        'user',
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ['in-progress', 'blocked'],
      default: 'in-progress',
    },
    auth_source: {
      type: String,
      enum: ['email', 'google'],
      default: 'email',
    },
    google_id: {
      type: String,
    },
    is_verified: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false, select: false },
    token_version: { type: Number, default: 1 },
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

userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { is_deleted: false },
    name: 'unique_email_not_deleted',
  },
);

userSchema.index(
  { google_id: 1 },
  {
    unique: true,
    partialFilterExpression: {
      is_deleted: false,
      google_id: { $exists: true, $ne: null },
    },
    name: 'unique_google_id_not_deleted',
  },
);

userSchema.index({ created_at: -1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ is_verified: 1 });
userSchema.index({ is_deleted: 1 });

// toJSON override to remove sensitive fields from output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.password_changed_at;
  delete user.is_deleted;
  return user;
};

// Post save middleware/ hook
userSchema.post<TUserDocument>(
  'save',
  { document: true, query: false },
  function (document: TUserDocument) {
    document.password = '';
  },
);

// Pre save middleware/ hook
userSchema.pre<TUserDocument>(
  'save',
  { document: true, query: false },
  async function (this: TUserDocument) {
    // Hash password
    if (this.isModified('password') && this.password) {
      this.password = await bcrypt.hash(
        this.password,
        Number(config.bcrypt_salt_rounds),
      );
      if (!this.isNew) {
        this.password_changed_at = new Date();
      }
    }

    // Reset is_verified on email change
    if (this.isModified('email')) {
      this.is_verified = false;
    }

    // Increment token_version on sensitive field change
    if (
      this.isModified('password') ||
      this.isModified('role') ||
      this.isModified('status')
    ) {
      this.token_version = (this.token_version || 0) + 1;
    }
  },
);

// Query middleware to exclude deleted users
userSchema.pre(/^find/, function (this: Query<TUser, TUser>, next) {
  const query = this;
  const opts = query.getOptions();

  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({
      ...query.getQuery(),
      is_deleted: { $ne: true },
    });
  }

  next();
});

// userSchema.pre(/^update/, function (this: Query<TUser, TUser>, next) {
//   this.setQuery({
//     ...this.getQuery(),
//     is_deleted: { $ne: true },
//   });
//   next();
// });

// Aggregation pipeline
userSchema.pre('aggregate', function (this: any, next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

// Static methods
userSchema.statics.isUserExist = async function (_id: string) {
  return await this.findById(_id).select(
    '+password +password_changed_at +token_version',
  );
};

userSchema.statics.isUserExistByEmail = async function (email: string) {
  return await this.findOne({ email: email }).select(
    '+password +password_changed_at +token_version',
  );
};

// Instance methods
userSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const User = mongoose.model<TUserDocument, TUserModel>(
  'User',
  userSchema,
);


