/**
 * Master seed script — wipes the entire DB and seeds everything fresh.
 *
 * Usage: npm run seed   (or: node seeds/seed.js)
 *
 * What it does:
 *   1. Drops ALL collections (users, verses, bookprogresses, dailyprogresses)
 *   2. Re-creates proper indexes
 *   3. Seeds every book in seeds/books/*.js
 *
 * ─────────────────────────────────────────────────────
 * HOW TO ADD A NEW BOOK:
 *
 *   1. Add book metadata to backend/constants/books.js
 *   2. Create backend/seeds/books/your-book-id.js
 *      - Export { bookId: string, getVerses: () => VerseDoc[] }
 *      - See shiv-tandav-stotram.js for a simple example
 *   3. Run: npm run seed
 *
 *   That's it. This script auto-discovers all files
 *   in the seeds/books/ directory and seeds them all.
 * ─────────────────────────────────────────────────────
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Models (importing ensures schemas + indexes are registered)
const Verse = require('../models/Verse');
const User = require('../models/User');
const BookProgress = require('../models/BookProgress');
const DailyProgress = require('../models/DailyProgress');

const BATCH_SIZE = 100;

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB\n');

    // ── Step 1: Wipe all collections ────────────────────────────────────────
    console.log('Wiping database...');
    const collections = ['verses', 'users', 'bookprogresses', 'dailyprogresses'];
    for (const name of collections) {
      try {
        await mongoose.connection.db.collection(name).drop();
        console.log(`  Dropped: ${name}`);
      } catch (e) {
        // Collection may not exist yet — that's fine
        if (e.codeName !== 'NamespaceNotFound') throw e;
        console.log(`  Skipped: ${name} (doesn't exist)`);
      }
    }

    // ── Step 2: Re-create indexes ───────────────────────────────────────────
    console.log('\nCreating indexes...');
    await Verse.createIndexes();
    await User.createIndexes();
    await BookProgress.createIndexes();
    await DailyProgress.createIndexes();
    console.log('  All indexes created');

    // ── Step 3: Auto-discover and seed all books ────────────────────────────
    const booksDir = path.join(__dirname, 'books');
    const bookFiles = fs.readdirSync(booksDir)
      .filter((f) => f.endsWith('.js'))
      .sort();

    console.log(`\nFound ${bookFiles.length} book(s) to seed:\n`);

    let grandTotal = 0;

    for (const file of bookFiles) {
      const bookModule = require(path.join(booksDir, file));
      const { bookId, getVerses } = bookModule;

      console.log(`── ${bookId} ──────────────────────────────────`);

      const verses = getVerses();
      console.log(`  Prepared ${verses.length} verses`);

      // Insert in batches
      let inserted = 0;
      for (let i = 0; i < verses.length; i += BATCH_SIZE) {
        const batch = verses.slice(i, i + BATCH_SIZE);
        await Verse.insertMany(batch);
        inserted += batch.length;
      }

      // Count quiz questions
      const totalQuestions = verses.reduce((sum, v) => sum + (v.questions?.length || 0), 0);

      // Count chapters
      const chapters = new Set(verses.map((v) => v.chapter));

      console.log(`  Inserted: ${inserted} verses, ${chapters.size} chapter(s), ${totalQuestions} quiz questions`);
      grandTotal += inserted;
    }

    // ── Summary ─────────────────────────────────────────────────────────────
    console.log('\n══════════════════════════════════════════════');
    console.log(`  SEED COMPLETE`);
    console.log(`  Books:  ${bookFiles.length}`);
    console.log(`  Verses: ${grandTotal}`);
    console.log('══════════════════════════════════════════════\n');

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('\nSeed error:', error);
    process.exit(1);
  }
}

seed();
