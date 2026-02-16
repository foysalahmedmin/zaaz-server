import mongoose, { Document, Schema } from 'mongoose';

export interface IPaymentAuditLog {
  transactionId: mongoose.Types.ObjectId;
  previousStatus?: string;
  newStatus: string;
  reason?: string;
  source: 'SYSTEM' | 'ADMIN' | 'WEBHOOK' | 'USER';
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  performedBy?: mongoose.Types.ObjectId; // Admin or System user ID
  createdAt: Date;
}

export interface IPaymentAuditLogDocument extends IPaymentAuditLog, Document {}

const PaymentAuditLogSchema = new Schema<IPaymentAuditLogDocument>(
  {
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'PaymentTransaction',
      required: true,
      index: true,
    },
    previousStatus: {
      type: String,
      trim: true,
    },
    newStatus: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ['SYSTEM', 'ADMIN', 'WEBHOOK', 'USER'],
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only createdAt is needed for audit logs
    versionKey: false,
  },
);

export const PaymentAuditLog = mongoose.model<IPaymentAuditLogDocument>(
  'PaymentAuditLog',
  PaymentAuditLogSchema,
);
