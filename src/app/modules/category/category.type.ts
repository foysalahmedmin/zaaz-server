import mongoose, { Document, Model, Types } from 'mongoose';

export type TStatus = 'active' | 'inactive';

export type TCategory = {
  icon?: string;
  name: string;
  description?: string;
  sequence: number;
  status: TStatus;
  tags: string[];
  category?: mongoose.Types.ObjectId | null;
  layout?: string;
  is_featured: boolean;
  is_deleted?: boolean;
};

export type TCategoryTree = TCategory & {
  _id: string;
  children?: TCategoryTree[];
};

export type TCategoryInput = {
  category_id: string;
  category_name: string;
  parent_id?: string;
};

export interface TCategoryDocument extends TCategory, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TCategoryDocument | null>;
}

export type TCategoryModel = Model<TCategoryDocument> & {
  isCategoryExist(_id: string): Promise<TCategoryDocument | null>;
};
