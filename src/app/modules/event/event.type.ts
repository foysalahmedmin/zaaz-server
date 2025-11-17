import mongoose, { Document, Model, Types } from 'mongoose';

export type TStatus = 'active' | 'inactive';

export type TEvent = {
  icon?: string;
  name: string;
  description?: string;
  status: TStatus;
  tags: string[];
  category?: mongoose.Types.ObjectId | null;
  layout?: string;
  published_at?: Date;
  expired_at?: Date;
  is_featured: boolean;
  is_deleted?: boolean;
};

export interface TEventDocument extends TEvent, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TEventDocument | null>;
}

export type TEventModel = Model<TEventDocument> & {
  isEventExist(_id: string): Promise<TEventDocument | null>;
};
