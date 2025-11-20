import { Document, Model, Types } from 'mongoose';

export type TNotificationAction = {
  title: string;
  type: string;
  url?: string;
};

export type TNotificationMetadata = {
  url?: string;
  image?: string;
  source?: string;
  reference?: string;
  actions?: TNotificationAction[];
};

export type TNotificationRecipient = {
  notification: Types.ObjectId;
  recipient: Types.ObjectId;
  metadata: TNotificationMetadata;
  is_read: boolean;
  read_at?: Date | null;
  is_deleted?: boolean;
};

export interface TNotificationRecipientDocument
  extends TNotificationRecipient,
    Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TNotificationRecipientDocument | null>;
}

export type TNotificationRecipientModel =
  Model<TNotificationRecipientDocument> & {
    isCategoryExist(
      _id: string,
    ): Promise<TNotificationRecipientDocument | null>;
  };
