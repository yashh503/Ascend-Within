/**
 * Populates English & Hindi translations for all 701 Bhagavad Gita verses.
 *
 * Data source: gita_translations.json (from github.com/gita/gita)
 * which contains translations from 7 renowned scholars in English and Hindi.
 *
 * Usage: node backend/seeds/fetchGitaTranslations.js
 *
 * English priority: Swami Sivananda > Swami Gambirananda > Shri Purohit Swami
 * Hindi priority:   Swami Tejomayananda > Swami Ramsukhdas
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const path = require('path');
const Verse = require('../models/Verse');

// Author priority for picking the best translation
const EN_PRIORITY = ['Swami Sivananda', 'Swami Gambirananda', 'Shri Purohit Swami', 'Swami Adidevananda', 'Dr. S. Sankaranarayan'];
const HI_PRIORITY = ['Swami Tejomayananda', 'Swami Ramsukhdas'];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Load translations JSON and original verses (for id → chapter/verse mapping)
    const translations = require(path.join(__dirname, '..', 'gita_translations.json'));
    const originalVerses = require(path.join(__dirname, '..', 'bhagvatgeetaallverses.json'));

    // Build verse_id → { chapter, verseNumber } map
    const idToVerse = {};
    originalVerses.forEach((v) => {
      idToVerse[v.id] = { chapter: v.chapter_number, verseNumber: v.verse_number };
    });

    // Group translations by verse_id
    const byVerse = {};
    translations.forEach((t) => {
      const id = t.verse_id;
      if (!byVerse[id]) byVerse[id] = { en: [], hi: [] };
      const entry = { author: t.authorName, text: (t.description || '').trim() };
      if (t.lang === 'english') byVerse[id].en.push(entry);
      if (t.lang === 'hindi') byVerse[id].hi.push(entry);
    });

    function pickBest(entries, priorityList) {
      for (const preferred of priorityList) {
        const match = entries.find((e) => e.author === preferred && e.text);
        if (match) return match.text;
      }
      // Fallback: first non-empty
      const fallback = entries.find((e) => e.text);
      return fallback ? fallback.text : '';
    }

    // Build bulk update operations
    const bulkOps = [];
    for (const [verseId, data] of Object.entries(byVerse)) {
      const loc = idToVerse[verseId];
      if (!loc) continue;

      const en = pickBest(data.en, EN_PRIORITY);
      const hi = pickBest(data.hi, HI_PRIORITY);

      if (!en && !hi) continue;

      const updateFields = {};
      if (en) {
        updateFields.translation = en;
        updateFields['translations.en'] = en;
      }
      if (hi) {
        updateFields['translations.hi'] = hi;
      }

      bulkOps.push({
        updateOne: {
          filter: { bookId: 'bhagavad-gita', chapter: loc.chapter, verseNumber: loc.verseNumber },
          update: { $set: updateFields },
        },
      });
    }

    console.log(`Prepared ${bulkOps.length} update operations`);

    // Execute in batches of 100
    const BATCH = 100;
    let processed = 0;
    for (let i = 0; i < bulkOps.length; i += BATCH) {
      const batch = bulkOps.slice(i, i + BATCH);
      const result = await Verse.bulkWrite(batch);
      processed += result.modifiedCount;
      console.log(`  Batch ${Math.floor(i / BATCH) + 1}: ${result.modifiedCount} updated (${processed} total)`);
    }

    console.log('\n========== Translation Update Complete ==========');
    console.log(`Total verses updated: ${processed}`);
    console.log(`English translations: from ${EN_PRIORITY[0]} (primary)`);
    console.log(`Hindi translations:   from ${HI_PRIORITY[0]} (primary)`);
    console.log('=================================================\n');

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
