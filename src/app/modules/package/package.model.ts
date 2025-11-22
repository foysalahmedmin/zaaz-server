import mongoose, { Query, Schema } from 'mongoose';
import { TPackage, TPackageDocument, TPackageModel } from './package.type';

const packageSchema = new Schema<TPackageDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    content: {
      type: String,
      trim: true,
    },
    token: {
      type: Number,
      required: [true, 'Token is required'],
      min: [0, 'Token must be 0 or greater'],
    },
    features: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Feature',
        required: [true, 'At least one feature is required'],
      },
    ],
    duration: {
      type: Number,
      min: [1, 'Duration must be at least 1 day'],
    },
    price: {
      USD: {
        type: Number,
        required: [true, 'Price USD is required'],
        min: [0, 'Price USD must be 0 or greater'],
      },
      BDT: {
        type: Number,
        required: [true, 'Price BDT is required'],
        min: [0, 'Price BDT must be 0 or greater'],
      },
    },
    price_previous: {
      USD: {
        type: Number,
        min: [0, 'Previous price USD must be 0 or greater'],
      },
      BDT: {
        type: Number,
        min: [0, 'Previous price BDT must be 0 or greater'],
      },
    },
    sequence: {
      type: Number,
      default: 0,
      min: [0, 'Sequence must be 0 or greater'],
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
packageSchema.methods.toJSON = function () {
  const packageDoc = this.toObject();
  delete packageDoc.is_deleted;
  return packageDoc;
};

packageSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TPackage, TPackage>;
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
packageSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

// Static methods
packageSchema.statics.isPackageExist = async function (_id: string) {
  return await this.findById(_id);
};

// Instance methods
packageSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const Package = mongoose.model<TPackageDocument, TPackageModel>(
  'Package',
  packageSchema,
);
