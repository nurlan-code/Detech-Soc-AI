# Detech SOC AI — Next.js + Supabase Platform

Real-time Security Operations Center platform built with Next.js 15, Supabase, and Groq AI.

## Tech Stack
- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage), Next.js API Routes
- **AI:** Groq API (llama-3.3-70b-versatile)
- **Email:** Resend API
- **Deploy:** Vercel

## Features
- Real-time alert monitoring (Supabase Realtime WebSockets)
- AI-powered alert triage (Groq)
- Phishing email analysis with AI verdict
- Incident management with JSONB timeline
- Vercel Cron — daily alert simulation
- Email notifications for critical alerts (Resend)
- Supabase Storage — phishing EML uploads

---

## CTF Lab — Intentional Vulnerabilities

> **WARNING:** This deployment contains **intentional security vulnerabilities**
> for a university CTF/pentest lab exercise.
> **DO NOT use this codebase as a production security reference.**

These vulnerabilities are fake/sandboxed — no real credentials or production data is exposed.

### Challenge Overview

| # | Type | Difficulty | Location |
|---|------|------------|----------|
| 1 | DOM-based XSS | Easy | `/search?q=` |
| 2 | Information Disclosure (Base64) | Medium | JS source maps |
| 3 | Client-Side Access Control Bypass | Medium | `/admin-panel` |
| 4 | Exposed .git Directory | Hard | `/.git/` |
| 5 | Unauthenticated Debug Endpoint | Hard | `/api/v1/debug/users` |
| 6 | Source Map Exposure | Easy (enabler) | F12 → Sources |

### Teacher/Instructor Notes
- Hint files: `public/ctf-hints/hint-0X-*.md` (do not share with students)
- All credentials in challenges are **fake** — domain `example-ctf.com`, `ctf-lab.internal`
- Real Supabase RLS and JWT auth remain intact
- Flags format: `CTF{...}` — collect all 6 to complete the lab

### What Students Should NOT Touch
- Real Supabase tables (alerts, incidents, phishing_cases, profiles)
- Real auth flow (`/login`, `/register`, `/mfa`)
- Real API keys in `.env.local` (not committed to git)
