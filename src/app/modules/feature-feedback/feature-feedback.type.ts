import { Document, Model, Types } from 'mongoose';

export type TFeatureFeedbackStatus = 'pending' | 'reviewed' | 'resolved';

export type TFeatureFeedback = {
  user: Types.ObjectId;
  feature: Types.ObjectId;
  rating: number; // 1 to 5
  comment: string;
  category: 'suggestion' | 'bug' | 'compliment' | 'other';
  status: TFeatureFeedbackStatus;
  admin_note?: string;
  is_deleted: boolean;
};

export interface TFeatureFeedbackDocument extends TFeatureFeedback, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TFeatureFeedbackDocument | null>;
}

export type TFeatureFeedbackModel = Model<TFeatureFeedbackDocument> & {
  isFeedbackExist(_id: string): Promise<TFeatureFeedbackDocument | null>;
};
