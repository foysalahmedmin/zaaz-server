import { Document, Model, Types } from 'mongoose';

export type TTokenProfit = {
  name: string;
  percentage: number;
  is_active: boolean;
  is_deleted?: boolean;
};

export interface TTokenProfitDocument extends TTokenProfit, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TTokenProfitDocument | null>;
}

export type TTokenProfitModel = Model<TTokenProfitDocument> & {
  isTokenProfitExist(_id: string): Promise<TTokenProfitDocument | null>;
};
