import { Document, Model, Types } from 'mongoose';

export type TFileType =
  | 'image'
  | 'video'
  | 'audio'
  | 'file'
  | 'pdf'
  | 'doc'
  | 'txt';

export type TFileStatus = 'active' | 'inactive' | 'archived';

export type TFileProvider = 'local' | 'gcs';

export type TFile = {
  _id?: Types.ObjectId | string;
  filename: string;
  originalname: string;
  name: string;
  url: string;
  mimetype: string;
  size: number;
  author: Types.ObjectId;
  provider: TFileProvider;
  category?: string;
  description?: string;
  caption?: string;
  status: TFileStatus;
  is_deleted: boolean;
  metadata?: {
    path?: string; // For local
    bucket?: string; // For GCS
    extension?: string;
    file_type?: TFileType;
  };
};

export type TFileInput = {
  name?: string;
  category?: string;
  description?: string;
  caption?: string;
  status?: TFileStatus;
};

export interface TFileDocument extends TFile, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TFileDocument | null>;
}

export type TFileModel = Model<TFileDocument> & {
  isFileExist(_id: string): Promise<TFileDocument | null>;
};
