import mongoose, { Query, Schema } from 'mongoose';
import { TEvent, TEventDocument, TEventModel } from './event.type';

const eventSchema = new Schema<TEventDocument>(
  {
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    icon: {
      type: String,
      default: 'calendar',
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    tags: {
      type: [String],
      default: [],
    },
    layout: {
      type: String,
      default: 'default',
    },
    published_at: {
      type: Date,
      required: function () {
        return this.status === 'active';
      },
      default: function (this: TEventDocument) {
        return this.status === 'active' ? new Date() : undefined;
      },
      validate: {
        validator: function (value: Date) {
          if (this.expired_at && value) {
            return value <= this.expired_at;
          }
          return true;
        },
        message: 'published_at cannot be after expired_at',
      },
    },

    expired_at: {
      type: Date,
      // default: function (this: TNewsHeadlineDocument) {
      //   if (this.status === 'published') {
      //     const publishedAt = this.published_at || new Date();
      //     return new Date(publishedAt.getTime() + 1 * 24 * 60 * 60 * 1000);
      //   }
      //   return undefined;
      // },
      validate: {
        validator: function (value: Date) {
          if (this.published_at && value) {
            return value >= this.published_at;
          }
          return true;
        },
        message: 'expired_at cannot be before published_at',
      },
    },
    is_featured: { type: Boolean, default: false },
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
eventSchema.methods.toJSON = function () {
  const event = this.toObject();
  delete event.is_deleted;
  return event;
};

eventSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TEvent, TEvent>;
  const opts = query.getOptions();

  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({
      ...query.getQuery(),
      is_deleted: { $ne: true },
    });
  }

  next();
});

// eventSchema.pre(
//   /^update/,
//   function (this: Query<TEvent, TEvent>, next) {
//     this.setQuery({
//       ...this.getQuery(),
//       is_deleted: { $ne: true },
//     });
//     next();
//   },
// );

// Aggregation pipeline
eventSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

// Static methods
eventSchema.statics.isEventExist = async function (_id: string) {
  return await this.findById(_id);
};

// Instance methods
eventSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  return await this.save();
};

export const Event = mongoose.model<TEventDocument, TEventModel>(
  'Event',
  eventSchema,
);
