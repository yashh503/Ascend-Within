# How to Add a New Book

This guide explains how to add a new book (e.g., Bible, Dhammapada, Meditations) to the app.

## Overview

The app uses a book-and-chapter reading system. Each book belongs to a **wisdom path** (e.g., `hinduism`). Users select a wisdom path during onboarding, and the Home screen shows all books available for their path.

The flow is: **Home (books list) → BookDetail (chapters) → BookSetup (pace) → Reading → Quiz**

---

## Step 1: Add Book Metadata

**File:** `backend/constants/books.js`

Add a new entry to the `BOOKS` object:

```js
const BOOKS = {
  'bhagavad-gita': { ... }, // existing

  'your-book-id': {
    id: 'your-book-id',
    name: 'Your Book Name',
    wisdomPath: 'your-wisdom-path',  // e.g., 'buddhism', 'stoicism'
    totalChapters: 10,               // number of chapters
    totalVerses: 250,                // total verses across all chapters
    chapters: {
      1: { name: 'Chapter One Title', verseCount: 25 },
      2: { name: 'Chapter Two Title', verseCount: 30 },
      // ... all chapters
    },
  },
};
```

**Important:**
- `id` must be a URL-safe slug (lowercase, hyphens only)
- `totalVerses` must equal the sum of all chapter `verseCount` values
- Chapter numbers must be sequential starting from 1

---

## Step 2: Add the Wisdom Path (if new)

If the book belongs to a new wisdom path that doesn't exist yet:

### 2a. Update the User model

**File:** `backend/models/User.js`

Add the new path to the `wisdomPath` enum:

```js
wisdomPath: {
  type: String,
  enum: ['hinduism', 'buddhism'],  // add your new path here
  default: null,
},
```

### 2b. Update the onboarding controller validation

**File:** `backend/controllers/verseController.js`

Update the allowed paths check in `completeOnboarding`:

```js
if (!['hinduism', 'buddhism'].includes(wisdomPath)) {
  return res.status(400).json({ message: 'Invalid wisdom path' });
}
```

### 2c. Add the path to the Onboarding screen

**File:** `frontend/src/screens/OnboardingScreen.js`

Add a new `TouchableOpacity` card in the wisdom path step (case 0) alongside the existing Hinduism card.

---

## Step 3: Seed the Verses into MongoDB

Each verse must be stored in the `Verse` model. The schema expects:

```js
{
  chapter: Number,          // chapter number (1-based)
  verseNumber: Number,      // verse number within the chapter (1-based)
  sanskrit: String,         // original text (or source language)
  transliteration: String,  // romanized version (optional)
  translation: String,      // English translation
  wordMeanings: String,     // word-by-word meanings (optional)
  explanation: String,      // detailed explanation (optional)
  questions: [{             // quiz questions (3 per verse recommended)
    question: String,
    options: [String],       // 4 options
    correctAnswer: Number,   // 0-based index of correct option
  }],
}
```

Create a seed script (e.g., `backend/seeds/seedYourBook.js`) and run it against your MongoDB instance.

**Important:** The `chapter` and `verseNumber` fields must match what you defined in `books.js`. The reading system fetches verses using:
```js
Verse.find({ chapter: X, verseNumber: { $gte: start, $lte: end } })
```

---

## Step 4: Verify

1. Register a new user (or reset an existing one)
2. During onboarding, select the appropriate wisdom path
3. On the Home screen, you should see your new book listed
4. Tap it → BookDetail shows all chapters
5. Tap a chapter → BookSetup asks for reading pace (first time only)
6. Start reading → verses appear sequentially
7. Complete reading → take quiz → chapter progress updates

---

## File Reference

| File | Purpose |
|------|---------|
| `backend/constants/books.js` | Book metadata, chapter names, verse counts |
| `backend/models/Verse.js` | Verse schema (content + quiz questions) |
| `backend/models/BookProgress.js` | Per-user per-book progress tracking |
| `backend/models/DailyProgress.js` | Per-session reading/quiz records |
| `backend/controllers/verseController.js` | Book listing, chapters, session generation |
| `backend/controllers/progressController.js` | Reading completion, quiz, streak |
| `frontend/src/screens/HomeScreen.js` | Books list (fetches from `/verses/books`) |
| `frontend/src/screens/BookDetailScreen.js` | Chapter list for a specific book |
| `frontend/src/screens/BookSetupScreen.js` | Reading pace selection |
| `frontend/src/screens/ReadingScreen.js` | Sequential verse reader |
| `frontend/src/screens/QuizScreen.js` | Post-reading quiz |

---

## Notes

- The `getSessionVerseCount` function in `books.js` handles pace calculation. It respects chapter boundaries — a session will never cross into the next chapter.
- Half-chapter pace uses `Math.ceil(verseCount / 2)` for the first half, with the remainder for the second session.
- Chapters unlock sequentially. Chapter 1 is always unlocked; subsequent chapters unlock after the previous one is completed.
- A chapter is marked complete when `currentVerseInChapter >= chapterVerseCount` after a passed quiz.
