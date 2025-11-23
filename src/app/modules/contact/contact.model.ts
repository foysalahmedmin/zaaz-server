import mongoose, { Schema } from 'mongoose';
import { TContactDocument, TContactModel } from './contact.type';

const contactSchema = new Schema<TContactDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      minlength: [3, 'Subject must be at least 3 characters'],
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
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

contactSchema.index({ email: 1 });
contactSchema.index({ created_at: -1 });

// toJSON override to remove sensitive fields from output
contactSchema.methods.toJSON = function () {
  const contact = this.toObject();
  delete contact.is_deleted;
  return contact;
};

contactSchema.pre(/^find/, function (next) {
  const query = this as unknown as mongoose.Query<TContactDocument, TContactDocument>;
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
contactSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { is_deleted: { $ne: true } } });
  next();
});

export const Contact = mongoose.model<TContactDocument, TContactModel>(
  'Contact',
  contactSchema,
);
