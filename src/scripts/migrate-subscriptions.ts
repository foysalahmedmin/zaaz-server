import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zaaz';

async function migrate() {
  console.log('🚀 Starting Subscription Migration...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('❌ Database not found');
    }
    const userWalletsCollection = db.collection('userwallets');
    const userSubscriptionsCollection = db.collection('usersubscriptions');
    const packagesCollection = db.collection('packages');
    const packageHistoriesCollection = db.collection('packagehistories');

    // 1. Fetch all wallets that have legacy package/plan info
    const walletsToMigrate = await userWalletsCollection.find({
      $or: [
        { package: { $exists: true, $ne: null } },
        { interval: { $exists: true, $ne: null } }
      ]
    }).toArray();

    console.log(`🔍 Found ${walletsToMigrate.length} wallets with legacy data.`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const wallet of walletsToMigrate) {
      const userId = wallet.user;
      
      // Check if they already have a subscription to avoid duplicates
      const existingSub = await userSubscriptionsCollection.findOne({ user: userId, status: 'active' });
      
      if (existingSub) {
        console.log(`⚠️ User ${userId} already has an active subscription. Skipping.`);
        skippedCount++;
        continue;
      }

      if (!wallet.package || !wallet.interval) {
        console.log(`⚠️ User ${userId} has incomplete legacy data. Skipping.`);
        skippedCount++;
        continue;
      }

      // Find the latest snapshot for this package to use as the history reference
      // We try to match the version if available, otherwise just latest
      const targetPackage = await packagesCollection.findOne({ _id: wallet.package });
      const version = targetPackage?.version || 1;

      const history = await packageHistoriesCollection.findOne(
        { package: wallet.package, version: version },
        { sort: { created_at: -1 } }
      ) || await packageHistoriesCollection.findOne(
        { package: wallet.package },
        { sort: { created_at: -1 } }
      );

      if (!history) {
        console.log(`❌ No PackageHistory found for package ${wallet.package}. Cannot migrate user ${userId}.`);
        skippedCount++;
        continue;
      }

      const now = new Date();
      const expiresAt = wallet.expires_at || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // Fallback to 30 days if missing

      // Create the subscription
      await userSubscriptionsCollection.insertOne({
        user: userId,
        package: wallet.package,
        package_snapshot: history._id,
        interval: wallet.interval,
        status: 'active',
        current_period_start: wallet.updated_at || now,
        current_period_end: expiresAt,
        cancel_at_period_end: false,
        auto_renew: true,
        created_at: now,
        updated_at: now,
        is_deleted: false,
        __v: 0
      });

      // Cleanup the wallet (optional: we can keep the fields but null them out, 
      // but since we removed them from the schema, they won't be visible anyway)
      await userWalletsCollection.updateOne(
        { _id: wallet._id },
        { $unset: { package: "", interval: "", expires_at: "", bonus_credits: "", type: "" } }
      );

      migratedCount++;
      if (migratedCount % 10 === 0) console.log(`⏳ Migrated ${migratedCount} users...`);
    }

    console.log('\n--- Migration Results ---');
    console.log(`✅ Successfully Migrated: ${migratedCount}`);
    console.log(`⚠️ Skipped: ${skippedCount}`);
    console.log('-------------------------\n');

  } catch (error) {
    console.error('❌ Migration Failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🏁 Disconnected from MongoDB');
    process.exit(0);
  }
}

migrate();
