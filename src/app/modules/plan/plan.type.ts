import { Document, Model, Types } from 'mongoose';

export type TPlan = {
  name: string;
  description?: string;
  duration: number;
  sequence?: number;
  is_active: boolean;
  is_deleted?: boolean;
};

export interface TPlanDocument extends TPlan, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TPlanDocument | null>;
}

export type TPlanModel = Model<TPlanDocument> & {
  isPlanExist(_id: string): Promise<TPlanDocument | null>;
};

