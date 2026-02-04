# Compass — AI Coaching That Turns Insight Into Action

> A personal coaching companion built with **Gemini 3** that helps you reflect, commit to next steps, and track progress over time.

## Overview

Compass is a mobile AI coaching app that transforms conversations into actionable growth. Unlike generic chatbots, Compass provides structured coaching sessions, accountability through commitments, and long-term progress tracking—all while giving you full control over what the app remembers.

## Features

- **Structured Coaching Sessions**: Choose from session types (Quick Check-in, Deep Dive, Reflection, Goal Review, Celebration, Grounding) for tailored coaching experiences
- **Commitment System**: Track commitments with "why it matters," due dates, reminders, and rescheduling
- **Memory Vault**: Review, edit, disable, or delete what Compass remembers about you
- **Progress Dashboard**: Visualize your growth journey with sessions, streaks, insights, and a chronological timeline
- **Voice Coaching**: Record voice notes that get transcribed and fed into the coaching pipeline
- **Proactive Engagement**: Morning intentions and evening reflections with push notifications

## Tech Stack

- **Frontend**: React Native + Expo (TypeScript)
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **AI**: Google Gemini API (Gemini 3 default model)
- **UI**: Modern design with gradients, glassmorphism, and Lucide icons

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI
- Supabase account
- Gemini API key
HOW TO TEST COMPASS:

1. Download Expo Go app:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. Open this link on your phone:
   exp://u.expo.dev/update/5325aed3-742d-4645-9d60-23a3a5272403

3. Or visit the EAS Dashboard and scan the QR code:
   https://expo.dev/accounts/gamechanger234/projects/compass-ai-coach/updates/5325aed3-742d-4645-9d60-23a3a5272403
### Installation

```bash
# Install dependencies
cd apps/mobile
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase URL, anon key, and Gemini API key

# Run the app
npx expo start
```

### Backend Setup

1. **Supabase Project**: Create a new Supabase project
2. **Database Migrations**: Run migrations in `supabase/migrations/` in order
3. **Edge Functions**: Deploy Edge Functions from `supabase/functions/`
4. **Secrets**: Set `GEMINI_API_KEY` in Supabase Edge Function secrets

See `DEVPOST_SUBMISSION_PACK.md` for detailed deployment instructions.

## Project Structure

```
├── apps/mobile/          # React Native mobile app
├── supabase/
│   ├── functions/        # Edge Functions (coach-turn, transcribe, notifications)
│   └── migrations/       # Database migrations
├── ai/
│   ├── orchestrator.ts   # Core AI orchestration
│   └── prompts/          # AI prompt definitions
└── README.md
```

## How Gemini 3 Powers Compass

Compass uses **Gemini 3** as the core intelligence layer:

- **Coaching Responses**: Each turn is generated from a structured prompt pipeline combining coach persona, user context, long-term memory, session-type instructions, and conversation history
- **Structured Extraction**: Gemini extracts session summaries, commitments, and user memories from conversations
- **Voice Transcription**: Audio recordings are transcribed using Gemini's multimodal capabilities
- **Continuity**: Extracted artifacts are stored and re-injected into future sessions for natural follow-ups

## License

MIT

## Built for

[Gemini 3 Hackathon](https://gemini3.devpost.com/)
