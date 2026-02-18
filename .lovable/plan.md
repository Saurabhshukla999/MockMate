

# Phase 1: Auth, Profiles, and Elo-Based Matching

This plan focuses on setting up authentication, user profiles with skill selection, and a simple Elo-based matching algorithm. Video/whiteboard pages will be built as placeholder UI.

---

## What Gets Built

1. **Supabase backend** -- Database tables for profiles, skills, Elo ratings, user roles, and session history
2. **Auth pages** -- Login, Signup, and Forgot/Reset Password flows
3. **Profile setup** -- Skill selection (DSA, React, DBMS, etc.), college, and bio
4. **Dashboard** -- View upcoming sessions, Elo rating, match history
5. **Matchmaking** -- Find a peer based on skill + Elo proximity, create a session
6. **Session room (placeholder)** -- Video area, whiteboard panel, and chat panel with mock UI
7. **Quiz page (placeholder)** -- GATE-style aptitude quiz shell with sample questions
8. **Analytics (placeholder)** -- Basic charts showing sessions completed, rating trend

---

## Database Schema

```text
profiles
  - id (uuid, FK -> auth.users)
  - display_name (text)
  - college (text)
  - bio (text)
  - avatar_url (text)
  - elo_rating (int, default 1200)
  - skills (text[])  -- e.g. ['DSA', 'React', 'DBMS']
  - created_at, updated_at

user_roles
  - id (uuid PK)
  - user_id (FK -> auth.users)
  - role (app_role enum: admin, moderator, user)

sessions
  - id (uuid PK)
  - user_a (FK -> profiles)
  - user_b (FK -> profiles)
  - skill (text)
  - status (enum: pending, active, completed, cancelled)
  - scheduled_at (timestamptz)
  - completed_at (timestamptz)
  - rating_a (int, nullable) -- user_a rates user_b
  - rating_b (int, nullable) -- user_b rates user_a

quiz_attempts (placeholder)
  - id, user_id, quiz_id, score, completed_at
```

RLS policies will ensure users can only read/update their own profiles and see sessions they participate in. The `has_role` security-definer pattern will be used for admin access.

---

## New Pages and Routes

| Route | Page | Description |
|-------|------|-------------|
| `/auth` | Auth | Login / Signup tabs |
| `/reset-password` | ResetPassword | Set new password after email link |
| `/dashboard` | Dashboard | Home for logged-in users |
| `/profile/setup` | ProfileSetup | Onboarding skill/college selection |
| `/match` | FindMatch | Matchmaking UI with skill filter |
| `/session/:id` | SessionRoom | Placeholder video + whiteboard + chat |
| `/quizzes` | Quizzes | Sample GATE-style quiz shell |
| `/analytics` | Analytics | Rating trend chart, session stats |

---

## New Components

- **AuthForm** -- Email/password login and signup with Supabase Auth
- **ProtectedRoute** -- Wrapper redirecting unauthenticated users to `/auth`
- **Navbar** -- Authenticated navigation with avatar, links, logout
- **ProfileSetupForm** -- Multi-select skills, college input, avatar upload
- **DashboardStats** -- Elo rating card, sessions count, upcoming matches
- **MatchFinder** -- Select skill, click "Find Match", shows matched peer
- **SessionRoom** -- Placeholder layout: video area, whiteboard canvas, chat sidebar
- **QuizCard** -- MCQ question with options and timer
- **RatingTrendChart** -- Recharts line chart of Elo over time

---

## Matching Algorithm (Simple Elo)

The matching works as follows:
1. User selects a skill and requests a match
2. Query finds users with the same skill whose Elo is within +/- 200 of the requester
3. Closest Elo match is selected; a session is created with status "pending"
4. After session completion, Elo is updated using standard Elo formula (K=32)

This will be implemented as a Supabase Edge Function for server-side matching logic.

---

## Technical Details

- **Auth**: Supabase Auth with email/password; `onAuthStateChange` listener with `getSession` check
- **Profile auto-creation**: Database trigger on `auth.users` insert creates a profile row
- **Protected routes**: React component checking auth state, redirecting to `/auth`
- **State management**: TanStack Query for server state (profiles, sessions, quizzes)
- **Charts**: Recharts (already installed) for the analytics rating trend
- **Edge function**: `match-peer` function for matchmaking with Elo proximity query

---

## Implementation Order

1. Connect Supabase (Cloud preferred)
2. Create migrations: profiles, user_roles, sessions tables + RLS + triggers
3. Build Auth pages (login, signup, reset password)
4. Build profile setup page with skill selection
5. Build protected route wrapper + navbar
6. Build dashboard with stats
7. Build match finder page + `match-peer` edge function
8. Build session room placeholder UI
9. Build quiz placeholder page
10. Build analytics page with rating chart

