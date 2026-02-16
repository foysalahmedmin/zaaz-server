import { PaymentGatewayFactory } from '../../payment-gateways';
import { PaymentAuditLog } from './payment-audit.model';
import { PaymentTransaction } from './payment-transaction.model';
import { updatePaymentTransactionStatus } from './payment-transaction.service';

/**
 * Payment Reconciliation Service
 *
 * Responsible for verifying pending transactions with gateways
 * and updating their status if a discrepancy is found.
 */
export const reconcilePendingTransactions = async () => {
  console.log('[PaymentReconciliation] Starting reconciliation job...');

  // 1. Define criteria: Pending transactions older than 15 minutes
  // We avoid checking very recent transactions to prevent race conditions with ongoing redirects/webhooks
  const thresholdTime = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
  const limitTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago (don't check ancient ones)

  const transactions = await PaymentTransaction.find({
    status: 'pending',
    created_at: { $lte: thresholdTime, $gte: limitTime },
    gateway_transaction_id: { $ne: '', $exists: true }, // Must have a gateway ID to verify
    is_deleted: { $ne: true },
  }).populate('payment_method');

  console.log(
    `[PaymentReconciliation] Found ${transactions.length} pending transactions to verify.`,
  );

  const stats = {
    total: transactions.length,
    success: 0,
    failed: 0,
    error: 0,
    skipped: 0,
  };

  for (const transaction of transactions) {
    try {
      if (!transaction.gateway_transaction_id) {
        stats.skipped++;
        continue;
      }

      if (!transaction.payment_method) {
        console.warn(
          `[PaymentReconciliation] Transaction ${transaction._id} has no payment method.`,
        );
        stats.skipped++;
        continue;
      }

      // 2. Instantiate Gateway
      const gateway = PaymentGatewayFactory.create(
        transaction.payment_method as any,
      );

      // 3. Verify Payment
      const verificationResponse = await gateway.verifyPayment(
        transaction.gateway_transaction_id,
      );

      // 4. Update Status based on verification
      if (verificationResponse.success) {
        console.log(
          `[PaymentReconciliation] Transaction ${transaction._id} verified as SUCCESS at gateway. Updating...`,
        );
        await updatePaymentTransactionStatus(
          transaction._id.toString(),
          'success',
          undefined,
          {
            source: 'RECONCILIATION_JOB',
            reason: 'Gateway verification confirmed success',
            metadata: { verificationResponse },
          },
        );
        stats.success++;
      } else if (
        verificationResponse.status === 'failed' ||
        verificationResponse.status === 'cancelled' ||
        verificationResponse.status === 'FAILED' ||
        verificationResponse.status === 'CANCELLED'
      ) {
        console.log(
          `[PaymentReconciliation] Transaction ${transaction._id} verified as FAILED at gateway. Updating...`,
        );
        await updatePaymentTransactionStatus(
          transaction._id.toString(),
          'failed',
          undefined,
          {
            source: 'RECONCILIATION_JOB',
            reason: `Gateway outcome: ${verificationResponse.status}`,
            metadata: { verificationResponse },
          },
        );
        stats.failed++;
      } else {
        // Status remains pending or unknown (e.g. gateway says 'pending')
        stats.skipped++;
      }
    } catch (error: any) {
      console.error(
        `[PaymentReconciliation] Error processing transaction ${transaction._id}:`,
        error.message,
      );
      stats.error++;

      // Log failure to audit for manual inspection
      try {
        await PaymentAuditLog.create([
          {
            transactionId: transaction._id,
            previousStatus: transaction.status,
            newStatus: transaction.status, // Unchanged
            source: 'RECONCILIATION_JOB',
            reason: 'Reconciliation error',
            metadata: { error: error.message },
          },
        ]);
      } catch (e) {
        // Ignore audit log error
      }
    }
  }

  console.log('[PaymentReconciliation] Job completed.', stats);
  return stats;
};
