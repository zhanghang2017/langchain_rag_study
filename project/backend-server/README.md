# backend-server

This service uses Prisma + SQLite for Node-side metadata storage.

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment

Copy `.env.example` to `.env` and keep:

```env
DATABASE_URL="file:./dev.db"
```

## 3) Create database schema

```bash
npm run prisma:migrate
```

Alternative without migration files:

```bash
npm run prisma:push
```

## 4) Generate Prisma client

```bash
npm run prisma:generate
```

## 5) Inspect data in browser

```bash
npm run prisma:studio
```

## Current models

- AppUser
- KnowledgeFile
- IngestionTask
- FileChunk
- ChatSession
- ChatMessage
