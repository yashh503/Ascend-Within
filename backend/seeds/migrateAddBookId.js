/**
 * One-time migration: adds bookId='bhagavad-gita' to all existing verses
 * that don't have a bookId set. Run this ONCE after updating the Verse model.
 *
 * Usage: node backend/seeds/migrateAddBookId.js
 *
 * After running this, you can also drop the old index if needed:
 *   db.verses.dropIndex({ chapter: 1, verseNumber: 1 })
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('verses');

    // Backfill bookId on all documents that don't have it
    const result = await collection.updateMany(
      { bookId: { $exists: false } },
      { $set: { bookId: 'bhagavad-gita' } }
    );

    console.log(`Updated ${result.modifiedCount} verses with bookId='bhagavad-gita'`);

    // Drop old index if it exists
    try {
      await collection.dropIndex('chapter_1_verseNumber_1');
      console.log('Dropped old index: chapter_1_verseNumber_1');
    } catch (e) {
      console.log('Old index not found (already removed or never existed) — skipping');
    }

    // Ensure new index exists
    await collection.createIndex(
      { bookId: 1, chapter: 1, verseNumber: 1 },
      { unique: true }
    );
    console.log('Ensured new index: bookId_1_chapter_1_verseNumber_1');

    await mongoose.connection.close();
    console.log('\nMigration complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrate();
