import mongoose, { Schema } from 'mongoose';
import { TStorageDocument, TStorageModel } from './storage.type';

const storageSchema = new Schema<TStorageDocument, TStorageModel>(
  {
    name: {
      type: String,
      required: true,
    },
    file_name: {
      type: String,
      required: true,
    },
    field_name: {
      type: String,
      required: true,
    },
    
    bucket: {
      type: String,
      required: true,
    },
    url: {
      type: String,
    },
    path: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    mime_type: {
      type: String,
      required: true,
    },
    uploaded_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    versionKey: false,
  },
);

export const Storage = mongoose.model<TStorageDocument, TStorageModel>(
  'Storage',
  storageSchema,
);
