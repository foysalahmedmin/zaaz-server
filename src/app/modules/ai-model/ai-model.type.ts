import { Document, Model, Types } from 'mongoose';

export type TAiModel = {
  name: string;
  value: string;
  provider: string;
  input_token_price: number;
  output_token_price: number;
  currency: 'USD';
  is_active: boolean;
  is_initial: boolean;
  is_deleted: boolean;
};

export interface TAiModelDocument extends TAiModel, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TAiModelDocument | null>;
}

export type TAiModelModel = Model<TAiModelDocument> & {
  isAiModelExist(_id: string): Promise<TAiModelDocument | null>;
  isAiModelExistByValue(value: string): Promise<TAiModelDocument | null>;
};
