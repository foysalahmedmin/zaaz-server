import httpStatus from 'http-status';
import AppError from '../../builder/AppError';
import { TPaymentTransactionStatus } from './payment-transaction.type';

export class PaymentStateMachine {
  private static readonly transitions: Record<
    TPaymentTransactionStatus,
    TPaymentTransactionStatus[]
  > = {
    pending: ['success', 'failed'],
    success: ['refunded'],
    failed: [], // Terminal state
    refunded: [], // Terminal state
  };

  /**
   * Validates if a transition is allowed.
   * Throws error if invalid.
   */
  static validate(
    currentStatus: TPaymentTransactionStatus,
    targetStatus: TPaymentTransactionStatus,
  ): void {
    if (currentStatus === targetStatus) return; // Same status is allowed (idempotency)

    const allowed = this.transitions[currentStatus];
    if (!allowed || !allowed.includes(targetStatus)) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Invalid status transition from ${currentStatus} to ${targetStatus}`,
      );
    }
  }

  /**
   * Checks if a transition is allowed without throwing.
   */
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
