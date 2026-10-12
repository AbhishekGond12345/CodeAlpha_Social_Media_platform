# Cobble — Social Media Platform (MERN)

A mini social network: profiles, posts, comments, likes and a follow system.

**Stack:** React (Vite) · Node/Express · MongoDB (Mongoose) · Supabase (Auth + Postgres)

## Where user data lives

| Data | Stored in |
|---|---|
| Email + hashed password | Supabase Auth |
| Profile details (username, name, email, bio, avatar) | Supabase `profiles` table **and** MongoDB `users` |
| Posts, comments, likes, follows | MongoDB |
| Photo / video files | Supabase Storage bucket `media` (URL saved on the post in MongoDB) |

Registration writes to all stores and rolls back if any step fails. Editing a profile updates MongoDB and mirrors the change to Supabase.

## Setup (about 10 minutes)

### 1. Supabase
1. Create a project at supabase.com.
2. **SQL Editor** → paste and run `backend/supabase/schema.sql`.
3. **Project Settings → API** → copy the *Project URL*, *anon public* key and *service_role* key.
4. (Recommended for quick testing) **Authentication → Providers → Email** → turn off "Confirm email". The API already marks new users as confirmed, so this is optional.

### 2. MongoDB
Create a free cluster on MongoDB Atlas → **Connect → Drivers** → copy the connection string.
Add your IP under **Network Access** (or `0.0.0.0/0` while developing).

### 3. Fill in the env files
- `backend/.env` — MongoDB URI, Supabase URL / anon key / service-role key, JWT secret.
- `frontend/.env` — only `VITE_API_URL` (public).

Generate a JWT secret:
```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
The service-role key is a secret. It only goes in `backend/.env`, never in the frontend.

### 4. Run
```
# terminal 1
cd backend && npm install && npm run dev

# terminal 2
cd frontend && npm install && npm run dev
```
Open http://localhost:5173, create an account, then register a second one in another browser to try follows.

## Photos & videos
Users can attach one photo (JPG, PNG, WebP, GIF — up to 5 MB) or one video (MP4, WebM, MOV — up to 25 MB) to a post, or post media with no text. Files go to the Supabase Storage bucket `media`, which `schema.sql` creates for you. The profile page has a **Photos & videos** tab.

## API

| Method | Route | Auth | Purpose |
|---|---|---|---|
| POST | /api/auth/register | – | Create account |
| POST | /api/auth/login | – | Log in |
| GET | /api/auth/me | ✔ | Current user |
| GET | /api/posts?scope=following\|all&before= | optional | Feed (cursor pagination) |
| POST | /api/posts | ✔ | Create post (multipart: `content`, optional `media` file) |
| DELETE | /api/posts/:id | ✔ | Delete own post |
| POST | /api/posts/:id/like | ✔ | Toggle like |
| GET / POST | /api/posts/:id/comments | – / ✔ | List / add comments |
| DELETE | /api/posts/:id/comments/:commentId | ✔ | Delete own comment |
| GET | /api/users/:username | optional | Profile + counts |
| GET | /api/users/:username/posts | optional | A user's posts |
| POST | /api/users/:username/follow | ✔ | Toggle follow |
| GET | /api/users/suggestions | ✔ | People to follow |
| PUT | /api/users/me | ✔ | Edit own profile |

## Security notes
- Input validated with Zod; Helmet, CORS allow-list and rate limiting (stricter on auth routes).
- Passwords never touch MongoDB; Supabase hashes them.
- Row Level Security is enabled on `profiles`; only the server (service-role key) writes to it.

## Deploying
Backend → Render/Railway (set the same env vars, and set `CLIENT_URL` to your frontend URL).
Frontend → Vercel/Netlify (set `VITE_API_URL` to your backend URL + `/api`).
