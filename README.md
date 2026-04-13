# Rovik Web Demo

Voice-first Rovik demo built with Next.js, the browser Web Speech API, Groq, and Supabase-backed conversation memory.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS 4
- Browser Web Speech API for v1 transcript capture
- Groq via its OpenAI-compatible chat completions API
- Supabase for server-side conversation persistence and Google sign-in

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
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL` if you do not want to infer the project URL from the service-role key
- `NEXT_PUBLIC_DEMO_BROWSER_HINT` overrides the browser note in the UI

## Build and verify

```bash
npm run lint
npm run build
```

## Routes

- `/` compact landing page
- `/demo` interactive voice demo with multi-turn memory
- `/api/ask-rovik` provider-backed API route
- `/api/conversation/session` conversation bootstrap and restore route
- `/api/conversation/finalize` idle finalization and long-term memory route
- `/api/auth/google` Google sign-in redirect route
- `/auth/callback` Google OAuth callback route

## Key files

- `src/app/page.tsx` landing page
- `src/app/demo/page.tsx` demo route
- `src/components/demo-shell.tsx` voice capture, auth controls, and conversation flow
- `src/components/conversation-panel.tsx` persistent chat thread UI
- `src/app/api/ask-rovik/route.ts` request validation, context loading, and response persistence
- `src/lib/ai.ts` Groq integration plus rolling-summary compaction
- `src/lib/conversation-store.ts` Supabase storage-backed conversation persistence
- `src/lib/auth.ts` Google auth and session-cookie helpers
- `src/lib/supabase.ts` Supabase client and server config helpers
- `src/lib/demo-content.ts` editable copy and prompt config
- `src/lib/demo-types.ts` shared request/response types

## Deployment

This project is designed for Vercel deployment.

Required production environment variables:

- `GROQ_API_KEY` or `AI_API_KEY`
- optional `GROQ_MODEL`
- optional `GROQ_API_URL`
- `SUPABASE_SECRET_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- optional `SUPABASE_URL`
- optional `NEXT_PUBLIC_DEMO_BROWSER_HINT`
