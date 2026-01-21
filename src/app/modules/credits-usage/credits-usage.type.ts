import { Model, Types } from 'mongoose';

export interface TCreditsUsage {
  user: Types.ObjectId;
  email?: string;
  user_wallet: Types.ObjectId;
  feature_endpoint?: Types.ObjectId;
  credits_transaction: Types.ObjectId;
  usage_key?: string;
  credit_price?: number;
  ai_model?: string;
  input_tokens?: number;
  output_tokens?: number;
  input_credits?: number;
  output_credits?: number;
  input_token_price?: number;
  output_token_price?: number;
  profit_credits_percentage?: number;
  profit_credits?: number;
  cost_credits?: number;
  cost_price?: number;
  credits?: number;
  price?: number;
  rounding_credits?: number;
  rounding_price?: number;
  is_active?: boolean;
  is_deleted?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export type CreditsUsageModel = Model<TCreditsUsage>;
