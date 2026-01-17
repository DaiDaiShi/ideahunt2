# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Idea Spark is an AI-powered web app that helps users compare places (restaurants, hotels, etc.) by analyzing Google Maps reviews using Aspect-Based Sentiment Analysis (ABSA). Users provide Google Maps links, their preferences, and red flags. The system scrapes reviews, extracts specific aspects (food, service, price, etc.), and ranks locations by relevance.

## Commands

### Frontend (root directory)
```bash
npm run dev          # Start Vite dev server on port 8080
npm run build        # Production build
npm run lint         # ESLint check
```

### Firebase Cloud Functions (functions/)
```bash
cd functions
npm run build        # Compile TypeScript
npm run serve        # Run Firebase emulator
npm run deploy       # Deploy to Firebase
npm run logs         # View function logs
```

## Architecture

### Frontend (src/)
- **React 18 + TypeScript + Vite** with SWC
- **UI**: shadcn-ui components (Radix + Tailwind)
- **Routing**: React Router DOM - pages in `src/pages/`
- **Auth**: Firebase Auth with Google OAuth, exposed via `useAuth()` hook
- **State**: React Query for server state, Context for auth
- **Path alias**: `@/*` maps to `src/*`

### Backend (functions/src/index.ts)
Three main Cloud Functions:
1. `fetchReviews()` - Scrapes Google Maps via Apify API
2. `analyzeReviews()` - ABSA analysis using Groq Llama 3.3 70B
3. `generateAspects()` - Suggests common aspects for a location type

Data flow: User input → fetchReviews → analyzeReviews → Firestore → Results page

### Database
- **Firestore** for user profiles and analysis results
- Collections: users, analysis results with nested review data

## Key Files

- `functions/src/index.ts` - All backend logic (~590 lines)
- `src/pages/Analyze.tsx` - Main analysis form
- `src/pages/Results.tsx` - Ranked results display
- `src/hooks/useAuth.tsx` - Auth context provider
- `src/integrations/firebase/` - Firebase service modules

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind, shadcn-ui, React Query
- Backend: Firebase Cloud Functions (Node.js 20), Groq SDK
- Database: Firestore
- External: Apify (Google Maps scraping)

## Environment Variables

Frontend (VITE_* prefix):
- Firebase config (API_KEY, AUTH_DOMAIN, PROJECT_ID, etc.)

Backend (functions/.env or Firebase config):
- APIFY_API_KEY
- GROQ_API_KEY
