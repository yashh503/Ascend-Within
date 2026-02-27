# Ascend Within

Spiritual discipline + dopamine restriction mobile app.

## Prerequisites

- Node.js (v18+)
- MongoDB (running locally or a cloud URI)
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (iOS/Android)

## Backend Setup

```bash
cd backend
npm install
```

### Configure Environment

Edit `backend/.env` if needed:

```
PORT=5151
MONGODB_URI=mongodb://localhost:27017/ascendwithin
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=30d
```

### Seed the Database

```bash
npm run seed
```

This loads 20 Bhagavad Gita verses with quiz questions.

### Start the Server

```bash
npm run dev
```

Server runs at `http://localhost:5151`.

## Frontend Setup

```bash
cd frontend
npm install
```

### Configure API URL

Edit `frontend/src/services/api.js` line 4:

- **iOS Simulator**: `http://localhost:5151`
- **Android Emulator**: `http://10.0.2.2:5151`
- **Physical device**: `http://<your-local-ip>:5151`

### Start Expo

```bash
npx expo start
```

Scan the QR code with Expo Go.

## API Routes

| Method | Route               | Description              |
|--------|----------------------|--------------------------|
| POST   | /auth/register       | Create account           |
| POST   | /auth/login          | Sign in                  |
| GET    | /auth/profile        | Get user profile         |
| POST   | /verses/onboarding   | Complete onboarding      |
| GET    | /verses/daily        | Get daily assigned verses |
| POST   | /progress/quiz       | Submit quiz answers      |
| POST   | /progress/reflection | Submit reflection        |
| GET    | /progress/status     | Get today's status       |
| POST   | /progress/blocked    | Record blocked attempt   |
| GET    | /progress/analytics  | Get analytics data       |
| POST   | /discipline/update   | Update discipline level  |
| GET    | /discipline/prompt   | Check weekly prompt      |

## Project Structure

```
appnew/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── disciplineController.js
│   │   ├── progressController.js
│   │   └── verseController.js
│   ├── middleware/auth.js
│   ├── models/
│   │   ├── DailyProgress.js
│   │   ├── User.js
│   │   └── Verse.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── disciplineRoutes.js
│   │   ├── progressRoutes.js
│   │   └── verseRoutes.js
│   ├── seeds/verseSeeder.js
│   └── server.js
├── frontend/
│   ├── App.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── Button.js
│   │   │   ├── Card.js
│   │   │   ├── Input.js
│   │   │   └── ProgressBar.js
│   │   ├── constants/theme.js
│   │   ├── context/
│   │   │   ├── AppContext.js
│   │   │   └── AuthContext.js
│   │   ├── navigation/AppNavigator.js
│   │   ├── screens/
│   │   │   ├── AnalyticsScreen.js
│   │   │   ├── BlockedScreen.js
│   │   │   ├── HomeScreen.js
│   │   │   ├── LoginScreen.js
│   │   │   ├── OnboardingScreen.js
│   │   │   ├── QuizScreen.js
│   │   │   ├── ReadingScreen.js
│   │   │   ├── ReflectionScreen.js
│   │   │   ├── SettingsScreen.js
│   │   │   ├── SignupScreen.js
│   │   │   └── WelcomeScreen.js
│   │   ├── services/api.js
│   │   └── utils/blockingSimulator.js
│   ├── app.json
│   └── package.json
└── README.md
```

## Notes

- App blocking is simulated in Expo. Real blocking requires native Android APIs.
- Quiz questions are static (Phase 1). AI generation can be added later.
- Only Hinduism (Bhagavad Gita) path is available in Phase 1.
