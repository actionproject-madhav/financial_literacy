# FinLit

Gamified financial literacy platform for immigrants. Duolingo-style learning focused on US personal finance (banking, credit, taxes, investing, retirement, immigration finance).

## Core Features

- **Modules**: Banking, credit, taxes, investing, retirement, insurance, major purchases, consumer protection, crypto, financial planning
- **Lesson flow**: Content blocks (text, quiz, interactive), mastery-based unlock, linear progression within sections
- **Gamification**: Hearts (lives), gems (currency), XP, daily streaks, quests (daily/weekly/special), leaderboards
- **Auth**: Google OAuth, guest/demo mode

## Adaptive Learning Engine

- **BKT** (Bayesian Knowledge Tracing): Tracks skill mastery per knowledge component
- **FSRS**: Spaced repetition scheduling for review timing
- **IRT** (Item Response Theory): 2PL model for item difficulty calibration
- **Content selector**: Combines BKT, FSRS, IRT with Thompson Sampling. Targets p(correct) ~0.6 (zone of proximal development)
- **Recommendations**: Next lesson/section based on mastery, due reviews, and content selector output

## Personalization

- **Course prioritization**: Profile (country, visa, goals, experience) + diagnostic test results drive course order
- **LLM personalization**: Cultural bridge text, visa-specific content, simplified explanations by English level, hints, wrong-answer explanations
- **Diagnostic test**: Optional placement; informs domain_priority and domain_mastery for recommendations

## Tech Stack

- **Backend**: Flask, MongoDB, gunicorn
- **Frontend**: React 18, TypeScript, Vite, Tailwind, Zustand, Framer Motion
- **LLM**: Gemini (OpenAI fallback)
- **Voice**: ElevenLabs TTS + transcription; Google TTS fallback
- **Payments**: Stripe
- **Deploy**: Railway (backend), Vercel (frontend)

## Project Structure

```
backend/
  app.py              # Flask app entry
  auth.py             # OAuth
  blueprints/         # curriculum, adaptive, learners, quests, streaks, leaderboard, chat, social, payments, translate
  services/           # learning_engine, bkt, scheduler (FSRS), irt, content_selector, personalization, voice
  database.py
  mongo_collections.py
frontend/
  src/
    pages/            # Learn, Lesson, Section, Profile, Shop, Quests, Leaderboard, etc.
    components/
    services/api.ts   # API client
    stores/userStore.ts
    contexts/
```

## Setup

**Backend**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # add MONGO_URI, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc.
# or use requirements-prod.txt for lighter deps (no torch)
gunicorn app:app --bind 0.0.0.0:5000
```

**Frontend**
```bash
cd frontend
npm install
# VITE_API_BASE_URL=http://localhost:5000 in .env
npm run dev
```

## Environment

Backend: `MONGO_URI`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FLASK_SECRET_KEY`, `FRONTEND_URL`, `GEMINI_API_KEY` (or `OPENAI_API_KEY`), `ELEVENLABS_API_KEY` (optional), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

Frontend: `VITE_API_BASE_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_STRIPE_PUBLISHABLE_KEY`.
