# AI Resume Builder

Build a resume through a stateful AI chat (with photo/logos), then export a PDF.

## Quick start

```bash
docker compose up -d
cp .env.example .env.local   # fill AUTH_* and GOOGLE_GENERATIVE_AI_API_KEY
npm install
npx prisma migrate deploy
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with GitHub (auth only), then build your resume in **Workspace** chat.

Design docs live in `specs/002-ai-resume-builder/`.
