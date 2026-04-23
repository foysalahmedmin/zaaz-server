import { PaymentGatewayFactory } from '../../providers/payment-gateways';
import { PaymentAuditLog } from '../payment-transaction/payment-audit.model';
import { PaymentTransaction } from '../payment-transaction/payment-transaction.model';
import { updatePaymentTransactionStatus } from './payment.service';

export const reconcilePendingTransactions = async () => {
  const threshold_time = new Date(Date.now() - 15 * 60 * 1000);
  const limit_time = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const transactions = await PaymentTransaction.find({
    status: 'pending',
    created_at: { $lte: threshold_time, $gte: limit_time },
    gateway_transaction_id: { $ne: '', $exists: true },
    is_deleted: { $ne: true },
  }).populate('payment_method');

  const stats = {
    total: transactions.length,
    success: 0,
    failed: 0,
    error: 0,
    skipped: 0,
  };

  for (const transaction of transactions) {
    try {
      if (!transaction.gateway_transaction_id || !transaction.payment_method) {
        stats.skipped++;
        continue;
      }

      const gateway = PaymentGatewayFactory.create(transaction.payment_method as any);
      const verification_response = await gateway.verifyPayment(
        transaction.gateway_transaction_id,
      );

      if (verification_response.success) {
        await updatePaymentTransactionStatus(
          transaction._id.toString(),
          'success',
          undefined,
          {
            source: 'RECONCILIATION_JOB',
            reason: 'Gateway verification confirmed success',
            metadata: { verification_response },
          },
        );
        stats.success++;
      } else if (
        ['failed', 'cancelled', 'FAILED', 'CANCELLED'].includes(
          verification_response.status ?? '',
        )
      ) {
        await updatePaymentTransactionStatus(
          transaction._id.toString(),
          'failed',
          undefined,
          {
            source: 'RECONCILIATION_JOB',
            reason: `Gateway outcome: ${verification_response.status}`,
            metadata: { verification_response },
          },
        );
        stats.failed++;
      } else {
        stats.skipped++;
      }
    } catch (error: any) {
      stats.error++;
      try {
        await PaymentAuditLog.create([
          {
            transactionId: transaction._id,
            previousStatus: transaction.status,
            newStatus: transaction.status,
            source: 'RECONCILIATION_JOB',
            reason: 'Reconciliation error',
            metadata: { error: error.message },
          },
        ]);
      } catch {
        // ignore audit log error
      }
    }
  }

  return stats;
};
