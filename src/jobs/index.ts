import cron from 'node-cron';
import { UserSubscription } from '../modules/user-subscription/user-subscription.model';
import { reconcilePendingTransactions } from '../modules/payment/payment-reconciliation.service';
import { retryUnprocessedPaymentConsumers } from '../modules/payment/payment.consumers';

/**
 * Initialize all background cron jobs
 */
export const initializeJobs = () => {
  // 1. Every midnight: Expire subscriptions that passed their end date
  cron.schedule('0 0 * * *', async () => {
    console.log('[Cron] Running subscription expiration job...');
    await expireSubscriptions();
  });

  // 2. Every 15 minutes: Reconcile pending payment transactions with gateway
  cron.schedule('*/15 * * * *', async () => {
    console.log('[Cron] Running payment reconciliation job...');
    try {
      const stats = await reconcilePendingTransactions();
      if (stats.success > 0 || stats.failed > 0) {
        console.log(`[Cron] Reconciliation done — success: ${stats.success}, failed: ${stats.failed}, skipped: ${stats.skipped}, error: ${stats.error}`);
      }
    } catch (error) {
      console.error('[Cron] Reconciliation job failed:', error);
    }
  });

  // 3. Every 30 minutes: Retry success transactions where consumer failed to process
  cron.schedule('*/30 * * * *', async () => {
    console.log('[Cron] Running payment consumer retry job...');
    try {
      await retryUnprocessedPaymentConsumers();
    } catch (error) {
      console.error('[Cron] Consumer retry job failed:', error);
    }
  });

  console.log('[Jobs] Background jobs initialized');
};

/**
 * Finds all active subscriptions where current_period_end < now and marks them expired.
 */
export const expireSubscriptions = async () => {
  const now = new Date();
  
  try {
    const result = await UserSubscription.updateMany(
      {
        status: 'active',
        current_period_end: { $lt: now }
      },
      {
        $set: { status: 'expired' }
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ [Expiration Job] Expired ${result.modifiedCount} subscriptions.`);
    }
  } catch (error) {
    console.error('❌ [Expiration Job] Failed:', error);
  }
};
