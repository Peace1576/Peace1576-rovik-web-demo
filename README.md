# Rovik Web Demo

Voice-first Rovik demo built with Next.js, the browser Web Speech API, and Groq.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Browser Web Speech API for v1 transcript capture
- Groq via its OpenAI-compatible chat completions API

## Local development

Install dependencies, configure an API key, and run the development server:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Set one of these environment variables before testing the live AI flow:

- `GROQ_API_KEY`
- `AI_API_KEY`

Optional:

- `GROQ_MODEL` defaults to `llama-3.3-70b-versatile`
- `GROQ_API_URL` defaults to `https://api.groq.com/openai/v1/chat/completions`
- `AI_MODEL`
- `AI_API_URL`
- `NEXT_PUBLIC_DEMO_BROWSER_HINT` overrides the browser note in the UI

## Build and verify

```bash
npm run lint
npm run build
```

## Routes

- `/` compact landing page
- `/demo` interactive voice demo
- `/api/ask-rovik` provider-backed API route

## Key files

- `src/app/page.tsx` landing page
- `src/app/demo/page.tsx` demo route
- `src/components/demo-shell.tsx` voice capture and submission flow
- `src/app/api/ask-rovik/route.ts` request validation and API handler
- `src/lib/ai.ts` Groq integration
- `src/lib/demo-content.ts` editable copy and prompt config
- `src/lib/demo-types.ts` shared request/response types

## Deployment

This project is designed for Vercel deployment.

Required production environment variables:

- `GROQ_API_KEY` or `AI_API_KEY`
- optional `GROQ_MODEL`
- optional `GROQ_API_URL`
- optional `NEXT_PUBLIC_DEMO_BROWSER_HINT`
