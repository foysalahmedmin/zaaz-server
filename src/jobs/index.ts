import cron from 'node-cron';
import { UserSubscription } from '../modules/user-subscription/user-subscription.model';

/**
 * Initialize all background cron jobs
 */
export const initializeJobs = () => {
  // 1. Every midnight: Expire subscriptions that passed their end date
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ [Cron] Running subscription expiration job...');
    await expireSubscriptions();
  });
  
  console.log('✅ Background jobs initialized');
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
