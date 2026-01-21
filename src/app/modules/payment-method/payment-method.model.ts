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
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    value: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      lowercase: true,
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
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    sequence: {
      type: Number,
      default: 0,
      min: [0, 'Sequence must be 0 or greater'],
    },
    currencies: {
      type: [String],
      default: [],
    },
    config: {
      type: Schema.Types.Mixed,
      select: false, // Don't include in default queries
    },
    is_test: {
      type: Boolean,
      default: false,
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

// Indexes
paymentMethodSchema.index({ is_active: 1 });
paymentMethodSchema.index({ is_deleted: 1 });
paymentMethodSchema.index({ currency: 1 });
paymentMethodSchema.index({ created_at: -1 });

// Compound unique index
paymentMethodSchema.index(
  { value: 1, is_test: 1 },
  {
    unique: true,
    partialFilterExpression: { is_deleted: { $ne: true } },
  },
);

// toJSON override to remove sensitive fields from output
paymentMethodSchema.methods.toJSON = function () {
  const paymentMethod = this.toObject();
  delete paymentMethod.is_deleted;
  delete paymentMethod.secret;
  delete paymentMethod.public_key;
  delete paymentMethod.webhook_key;
  return paymentMethod;
};

paymentMethodSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TPaymentMethod, TPaymentMethod>;
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
