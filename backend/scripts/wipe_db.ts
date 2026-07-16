import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend/.env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const wipeDatabase = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('❌ MONGODB_URI is not set in backend/.env');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB at: ${mongoUri.replace(/:([^@]+)@/, ':****@')}`);

  try {
    await mongoose.connect(mongoUri);
    console.log('📡 Connected to MongoDB.');

    // Collections to wipe
    const collections = [
      'users',
      'transactions',
      'budgets',
      'goals',
      'investments',
      'aihistories',
      'notifications'
    ];

    console.log('⚠️ WARNING: Starting destructive database wipe of test data...');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection object is undefined.');
    }

    for (const name of collections) {
      try {
        const result = await db.collection(name).deleteMany({});
        console.log(`🧹 Wiped collection "${name}": deleted ${result.deletedCount} documents.`);
      } catch (err) {
        console.warn(`⚠️ Collection "${name}" did not exist or failed to clear: ${(err as Error).message}`);
      }
    }

    console.log('✅ Database wipe completed successfully.');
  } catch (error) {
    console.error('❌ Error during database wipe:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

wipeDatabase();
