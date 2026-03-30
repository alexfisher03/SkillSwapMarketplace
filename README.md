# Skill Swap Marketplace (UF)

Skill Swap is a small MVP for posting and browsing help offers/requests.
Listings can be `misc` or `course`. Course listings use UF Schedule of Courses search.

## What works now

- Signup and login with email/password
- Create listings
- View all listings (Skill Swap page)
- View your own listings (Dashboard page)
- Course-code lookup through UF SOC and section selection for course listings

## Local setup

1. Copy `.env.example` to `.env`
2. Install dependencies: `npm install`
3. Start Postgres: `npm run db:up`
4. Start app: `npm run dev`
5. Open:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3001`

If you need a fresh database:

- `npm run db:reset`

## Environment variables

- `DATABASE_URL` - Postgres connection string
- `PORT` - backend port
- `JWT_SECRET` - secret key used to sign authentication tokens
- `VITE_API_BASE_URL` - optional absolute API base URL (leave empty to use `/api` proxy)
- `VITE_UF_DEFAULT_TERM` - default term used in the frontend listing form
- `UF_DEFAULT_TERM` - backend default term for UF course search
- `UF_SOC_CATEGORY` - UF SOC category (default `CWSP`)
- `UF_SOC_SCHEDULE_URL` - UF SOC base URL

## UF API usage

Source documentation:

- [Rolstenhouse/uf_api](https://github.com/Rolstenhouse/uf_api)

This project currently uses only:

- `GET https://one.ufl.edu/apix/soc/schedule/`

Backend wrapper route:

- `GET /api/uf/courses/search?q=...&term=...`

Response shape used by frontend:

- `code`
- `courseId`
- `title`
- `sections[]` with section number, class number, instructor, meeting, campus

## API routes

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/health`
- `GET /api/listings`
- `POST /api/listings`
- `GET /api/uf/courses/search`

## Current limitations

- Auth is intentionally basic (credential check + frontend current-user state)
- No JWT, session hardening, password reset, or role model yet
- UF API is unofficial and can change without notice
