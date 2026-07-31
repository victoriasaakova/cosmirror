# Cosmirror Web

Next.js (React) frontend for Cosmirror. Talks to `cosmirror-api` (Django + SQLite).

## Setup

```bash
cd cosmirror-web
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

## Env

```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Backend must be running on port 8000 (see `../cosmirror-api/README.md`).
