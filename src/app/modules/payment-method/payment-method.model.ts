import mongoose, { Query, Schema } from 'mongoose';
import {
  TPaymentMethod,
  TPaymentMethodDocument,
  TPaymentMethodModel,
} from './payment-method.type';

const paymentMethodSchema = new Schema<TPaymentMethodDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    currency: {
      type: String,
      required: [true, 'Currency is required'],
      trim: true,
      uppercase: true,
      length: [3, 'Currency must be a 3-letter ISO code'],
    },
    secret: {
      type: String,
      required: [true, 'Secret is required'],
      trim: true,
    },
    public_key: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    is_active: {
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

// toJSON override to remove sensitive fields from output
paymentMethodSchema.methods.toJSON = function () {
  const paymentMethod = this.toObject();
  delete paymentMethod.is_deleted;
  delete paymentMethod.secret;
  delete paymentMethod.public_key;
  return paymentMethod;
};

paymentMethodSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<
    TPaymentMethod,
    TPaymentMethod
  >;
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
paymentMethodSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

// Static methods
paymentMethodSchema.statics.isPaymentMethodExist = async function (
  _id: string,
) {
  return await this.findById(_id);
};

// Instance methods
paymentMethodSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const PaymentMethod = mongoose.model<
  TPaymentMethodDocument,
  TPaymentMethodModel
>('PaymentMethod', paymentMethodSchema);

