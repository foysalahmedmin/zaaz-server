import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import { TPaymentTransactionStatus } from '../payment-transaction/payment-transaction.type';

export class PaymentStateMachine {
  private static readonly transitions: Record<
    TPaymentTransactionStatus,
    TPaymentTransactionStatus[]
  > = {
    pending: ['success', 'failed'],
    success: ['refunded'],
    failed: [],
    refunded: [],
  };

  static validate(
    currentStatus: TPaymentTransactionStatus,
    targetStatus: TPaymentTransactionStatus,
  ): void {
    if (currentStatus === targetStatus) return;

    const allowed = this.transitions[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid status transition from ${currentStatus} to ${targetStatus}`,
      );
    }
  }

  static canTransition(
    currentStatus: TPaymentTransactionStatus,
    targetStatus: TPaymentTransactionStatus,
  ): boolean {
    if (currentStatus === targetStatus) return true;
    return (
      !!this.transitions[currentStatus] &&
      this.transitions[currentStatus].includes(targetStatus)
    );
  }
}
