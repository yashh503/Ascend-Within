# How to Add a New Book

This guide explains how to add a new book/source to the app. We use the **Shiv Tandav Stotram** (already added) as a real example throughout.

## Overview

The app uses a book-and-chapter reading system. Each book belongs to a **wisdom path** (e.g., `hinduism`). Users select a wisdom path during onboarding, and the Home screen shows all books available for their path.

The flow is: **Home (books list) → BookDetail (chapters) → BookSetup (pace) → Reading → Quiz**

---

## Step 1: Add Book Metadata

**File:** `backend/constants/books.js`

Add a new entry to the `BOOKS` object:

```js
const BOOKS = {
  'bhagavad-gita': { ... },        // existing
  'shiv-tandav-stotram': { ... },  // existing

  'your-book-id': {
    id: 'your-book-id',
    name: 'Your Book Name',
    wisdomPath: 'hinduism',          // existing path, or a new one (see Step 2)
    totalChapters: 5,                // number of chapters
    totalVerses: 120,                // total verses across all chapters
    chapters: {
      1: { name: 'Chapter One Title', verseCount: 25 },
      2: { name: 'Chapter Two Title', verseCount: 30 },
      // ... all chapters
    },
  },
};
```

**Real example — Shiv Tandav Stotram** (single hymn = 1 chapter, 13 stanzas):
```js
'shiv-tandav-stotram': {
  id: 'shiv-tandav-stotram',
  name: 'Shiv Tandav Stotram',
  wisdomPath: 'hinduism',
  totalChapters: 1,
  totalVerses: 13,
  chapters: {
    1: { name: 'Shiv Tandav Stotram', verseCount: 13 },
  },
},
```

**Rules:**
- `id` must be a URL-safe slug (lowercase, hyphens only)
- `totalVerses` must equal the sum of all chapter `verseCount` values
- Chapter numbers must be sequential starting from 1
- For single hymns/poems, use 1 chapter

---

## Step 2: Add the Wisdom Path (if new)

**Skip this step** if your book belongs to an existing path (e.g., `hinduism`). The Shiv Tandav Stotram uses the existing `hinduism` path, so no changes were needed.

If the book belongs to a **new** wisdom path:

### 2a. Update the User model

**File:** `backend/models/User.js`

```js
wisdomPath: {
  type: String,
  enum: ['hinduism', 'buddhism'],  // add your new path here
  default: null,
},
```

### 2b. Update the onboarding controller validation

**File:** `backend/controllers/verseController.js`

```js
if (!['hinduism', 'buddhism'].includes(wisdomPath)) {
  return res.status(400).json({ message: 'Invalid wisdom path' });
}
```

### 2c. Add the path to the Onboarding screen

**File:** `frontend/src/screens/OnboardingScreen.js`

Add a new `TouchableOpacity` card in the wisdom path step (case 0) alongside the existing Hinduism card.

---

## Step 3: Create a Seed Script

**File:** `backend/seeds/yourBookSeeder.js`

Each verse must include a `bookId` field matching the book's `id` from Step 1. The Verse schema expects:

```js
{
  bookId: String,             // REQUIRED — must match the book id (e.g., 'shiv-tandav-stotram')
  chapter: Number,            // chapter number (1-based)
  verseNumber: Number,        // verse number within the chapter (1-based)
  sanskrit: String,           // original text (or source language)
  transliteration: String,    // romanized version (optional)
  translation: String,        // English translation
  wordMeanings: String,       // word-by-word meanings (format: "word—meaning; word—meaning")
  explanation: String,        // detailed explanation (optional)
  questions: [{               // quiz questions (3 per verse recommended)
    question: String,
    options: [String],         // 4 options
    correctAnswer: Number,     // 0-based index of correct option
  }],
}
```

**Key pattern for the seed script:**

```js
// Only delete YOUR book's verses (not other books)
await Verse.deleteMany({ bookId: 'your-book-id' });

// Insert with bookId on every document
const documents = verses.map((v) => ({
  bookId: 'your-book-id',      // ← CRITICAL
  chapter: v.chapter,
  verseNumber: v.verseNumber,
  sanskrit: v.text,
  // ... rest of fields
}));

await Verse.insertMany(documents);
```

**Reference:** See `backend/seeds/shivTandavSeeder.js` for a complete working example with inline verse data and quiz generation.

### Run the seeder

```bash
cd backend
node seeds/shivTandavSeeder.js
```

**Important:**
- The `bookId` + `chapter` + `verseNumber` combination must be unique (enforced by DB index)
- The `chapter` and `verseNumber` fields must match what you defined in `books.js`
- The reading system fetches verses using:
  ```js
  Verse.find({ bookId, chapter: X, verseNumber: { $gte: start, $lte: end } })
  ```

---

## Step 4: Verify

1. Run your seed script: `node backend/seeds/yourBookSeeder.js`
2. Start the backend: `node backend/server.js`
3. On the Home screen, you should see your new book listed alongside existing books
4. Tap it → BookDetail shows all chapters
5. Tap a chapter → BookSetup asks for reading pace (first time only)
6. Start reading → verses appear sequentially
7. Complete reading → take quiz → chapter progress updates

---

## Quick Checklist

- [ ] Added book metadata to `backend/constants/books.js`
- [ ] (If new wisdom path) Updated User model enum, controller validation, OnboardingScreen
- [ ] Created seed script with `bookId` on every verse document
- [ ] Seed script only deletes its own book's verses (`deleteMany({ bookId: '...' })`)
- [ ] Ran seed script successfully
- [ ] Verified the full flow in the app

---

## File Reference

| File | Purpose |
|------|---------|
| `backend/constants/books.js` | Book metadata, chapter names, verse counts |
| `backend/models/Verse.js` | Verse schema (bookId + content + quiz questions) |
| `backend/models/BookProgress.js` | Per-user per-book progress tracking |
| `backend/models/DailyProgress.js` | Per-session reading/quiz records |
| `backend/seeds/verseSeeder.js` | Bhagavad Gita seeder (reference) |
| `backend/seeds/shivTandavSeeder.js` | Shiv Tandav Stotram seeder (reference) |
| `backend/controllers/verseController.js` | Book listing, chapters, session generation |
| `backend/controllers/progressController.js` | Reading completion, quiz, streak |
| `frontend/src/screens/HomeScreen.js` | Books list (fetches from `/verses/books`) |
| `frontend/src/screens/BookDetailScreen.js` | Chapter list for a specific book |
| `frontend/src/screens/BookSetupScreen.js` | Reading pace selection |
| `frontend/src/screens/ReadingScreen.js` | Sequential verse reader |
| `frontend/src/screens/QuizScreen.js` | Post-reading quiz |

---

## Existing Books

| Book ID | Name | Wisdom Path | Chapters | Verses |
|---------|------|-------------|----------|--------|
| `bhagavad-gita` | Bhagavad Gita | hinduism | 18 | 701 |
| `shiv-tandav-stotram` | Shiv Tandav Stotram | hinduism | 1 | 13 |

---

## Notes

- The `getSessionVerseCount` function in `books.js` handles pace calculation. It respects chapter boundaries — a session will never cross into the next chapter.
- Half-chapter pace uses `Math.ceil(verseCount / 2)` for the first half, with the remainder for the second session.
- Chapters unlock sequentially. Chapter 1 is always unlocked; subsequent chapters unlock after the previous one is completed.
- A chapter is marked complete when `currentVerseInChapter >= chapterVerseCount` after a passed quiz.
- For small books (like Shiv Tandav with 13 verses), the "half_chapter" and "custom_5" pace options make the most sense.
