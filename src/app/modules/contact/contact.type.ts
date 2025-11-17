import { Document, Model } from 'mongoose';

export type TContact = {
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at?: Date;
  updated_at?: Date;
};

export interface TContactDocument extends TContact, Document {}

export interface TContactModel extends Model<TContactDocument> {}

export type TCreateContact = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

