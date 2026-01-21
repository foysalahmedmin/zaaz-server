import { Document, Model, Types } from 'mongoose';

export type TStorage = {
  name: string;
  file_name: string;
  field_name: string;
  bucket: string;
  url?: string;
  path: string;
  size: number;
  mime_type: string;
  uploaded_at: Date;
};

export interface TStorageDocument extends TStorage, Document {
  _id: Types.ObjectId;
}

export type TStorageModel = Model<TStorageDocument>;
