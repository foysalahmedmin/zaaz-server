import { Document, Model, Types } from 'mongoose';

export type TInterval = {
  name: string;
  description?: string;
  duration: number;
  sequence?: number;
  is_active: boolean;
  is_deleted?: boolean;
};

export interface TIntervalDocument extends TInterval, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TIntervalDocument | null>;
}

export type TIntervalModel = Model<TIntervalDocument> & {
  isIntervalExist(_id: string): Promise<TIntervalDocument | null>;
};
