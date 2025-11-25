import mongoose, { Query, Schema } from 'mongoose';
import {
  TPackageHistory,
  TPackageHistoryDocument,
  TPackageHistoryModel,
} from './package-history.type';

const packageHistorySchema = new Schema<TPackageHistoryDocument>(
  {
    package: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: [true, 'Package is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['token', 'subscription'],
    },
    badge: {
      type: String,
      trim: true,
    },
    points: [
      {
        type: String,
        trim: true,
      },
    ],
    // Embedded feature objects (not references)
    features: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          required: true,
        },
        parent: {
          type: Schema.Types.ObjectId,
          default: null,
          required: false,
        },
        name: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          trim: true,
        },
        path: {
          type: String,
          trim: true,
        },
        prefix: {
          type: String,
          trim: true,
        },
        type: {
          type: String,
          enum: ['writing', 'generation', 'other'],
        },
        sequence: {
          type: Number,
          default: 0,
        },
        is_active: {
          type: Boolean,
          default: true,
        },
        created_at: Date,
        updated_at: Date,
      },
    ],
    // Embedded package-plan objects with plan populated (not references)
    plans: [
      {
        _id: {
          type: Schema.Types.ObjectId,
          required: true,
        },
        plan: {
          _id: {
            type: Schema.Types.ObjectId,
            required: true,
          },
          name: {
            type: String,
            required: true,
            trim: true,
          },
          description: {
            type: String,
            trim: true,
          },
          duration: {
            type: Number,
            required: true,
          },
          is_active: {
            type: Boolean,
            default: true,
          },
          created_at: Date,
          updated_at: Date,
        },
        price: {
          USD: {
            type: Number,
            required: true,
            min: 0,
          },
          BDT: {
            type: Number,
            required: true,
            min: 0,
          },
        },
        previous_price: {
          USD: {
            type: Number,
            min: 0,
          },
          BDT: {
            type: Number,
            min: 0,
          },
        },
        token: {
          type: Number,
          required: true,
          min: 0,
        },
        is_initial: {
          type: Boolean,
          default: false,
        },
        is_active: {
          type: Boolean,
          default: true,
        },
        created_at: Date,
        updated_at: Date,
      },
    ],
    sequence: {
      type: Number,
      default: 0,
      min: [0, 'Sequence must be 0 or greater'],
    },
    is_active: {
      type: Boolean,
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
packageHistorySchema.methods.toJSON = function () {
  const packageHistory = this.toObject();
  delete packageHistory.is_deleted;
  return packageHistory;
};

packageHistorySchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TPackageHistory, TPackageHistory>;
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
packageHistorySchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

export const PackageHistory = mongoose.model<
  TPackageHistoryDocument,
  TPackageHistoryModel
>('PackageHistory', packageHistorySchema);
