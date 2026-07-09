# Supabase setup

## 1. Create a project

1. Go to https://supabase.com/dashboard and create a new project.
2. Pick a strong DB password (Supabase manages the rest).
3. Wait ~1 minute for provisioning.

## 2. Run the schema

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste the contents of `schema.sql` (in this folder) and hit **Run**.
   This creates the `courts`, `profiles`, `bookings` tables, enables
   Row Level Security, and seeds the 10 courts.

## 3. Auth settings

1. Go to **Authentication → Providers → Email**.
2. For local development, either disable **Confirm email** or use the
   magic link the dashboard shows. If you leave it on, users get a
   "check your email" response on signup instead of an immediate session.

## 4. Copy your keys

1. Go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. In the project root create `.env.local` (copy `.env.local.example`):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

4. Restart `npm run dev` so Next picks up the env.

## 5. Try it

- Sign up a new user → row lands in `auth.users` + `public.profiles`.
- Book a slot → row lands in `public.bookings` with your `user_id`.
- Cancel → row is deleted (RLS only lets you delete your own).

## Notes

- The old JSON files under `data/` are no longer read by the app.
  Keep them for reference or delete once you're confident.
- To reset dev data: `truncate public.bookings;` (courts stay via seed).
