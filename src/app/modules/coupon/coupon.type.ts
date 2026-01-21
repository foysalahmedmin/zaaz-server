import { Document, Model, Types } from 'mongoose';

export type TDiscountType = 'percentage' | 'fixed';

export type TCoupon = {
  code: string;
  discount_type: TDiscountType;
  discount_value: number; // For percentage: e.g. 10 for 10%. For fixed: optional or unused if using fixed_amount
  fixed_amount: {
    USD: number;
    BDT: number;
  };
  min_purchase_amount: {
    USD: number;
    BDT: number;
  };
  max_discount_amount: {
    USD: number;
    BDT: number;
  }; // Used for percentage discounts
  valid_from: Date;
  valid_until: Date;
  usage_limit: number;
  usage_count: number;
  applicable_packages: Types.ObjectId[]; // If empty, applicable to all packages
  is_active: boolean;
  is_deleted: boolean;
};

export interface TCouponDocument extends TCoupon, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TCouponDocument | null>;
}

export type TCouponModel = Model<TCouponDocument> & {
  isCouponExist(code: string): Promise<TCouponDocument | null>;
};
