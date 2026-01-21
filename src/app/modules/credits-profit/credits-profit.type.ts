import { Document, Model, Types } from 'mongoose';

export type TCreditsProfit = {
  name: string;
  percentage: number;
  is_active: boolean;
  is_deleted?: boolean;
};

export interface TCreditsProfitDocument extends TCreditsProfit, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TCreditsProfitDocument | null>;
}

export type TCreditsProfitModel = Model<TCreditsProfitDocument> & {
  isCreditsProfitExist(_id: string): Promise<TCreditsProfitDocument | null>;
};
