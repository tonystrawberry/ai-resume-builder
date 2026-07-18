# Quickstart: AI Resume Builder

**Feature**: `002-ai-resume-builder` | **Date**: 2026-07-18

## Prerequisites

- Node.js 20+
- npm
- PostgreSQL (Docker Compose on port 5433 by default)
- GitHub OAuth App (callback `http://localhost:3000/api/auth/callback/github`) — **sign-in only**
- Google Gemini API key

## 1. Install

```bash
npm install
docker compose up -d
```

## 2. Environment

```bash
DATABASE_URL="postgresql://resume:resume@127.0.0.1:5433/ai_resume_builder"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
GOOGLE_GENERATIVE_AI_API_KEY=""
GEMINI_MODEL="gemini-flash-latest"
```

## 3. Database

```bash
npx prisma migrate deploy
npx prisma generate
```

## 4. Run

```bash
npm run dev
```

## 5. Smoke checklist

| Step | Expected |
|------|----------|
| Sign in with GitHub | Lands on `/workspace` |
| Chat about your background | Assistant asks for name/role/experience |
| Confirm a suggested patch | Resume panel updates |
| Upload photo / logos | Appear on resume panel |
| Export PDF from Workspace | Print dialog → Save as PDF (matches preview) |
