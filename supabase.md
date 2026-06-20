# Supabase Setup

## 1. Create a project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**, give it a name (e.g. `spacegame`), choose a region, set a database password, and click **Create new project**.
3. Wait for the project to finish provisioning (~1 minute).

## 2. Create the spacegame_highscores table

All tables in this project are prefixed `spacegame_`. Open the **SQL Editor** (left sidebar) and run:

```sql
create table spacegame_highscores (
  id            bigint generated always as identity primary key,
  name          text        not null,
  score         bigint      not null,
  highest_level integer     not null,
  version       text,
  created_at    timestamptz not null default now()
);

-- RLS is enabled by default on every table, so anon has no access until
-- the policies below are created. This re-enables it explicitly in case
-- the default ever changes.
alter table spacegame_highscores enable row level security;

-- Anyone can insert and read scores; no one can update or delete.
create policy "insert scores" on spacegame_highscores
  for insert to anon with check (true);

create policy "read scores" on spacegame_highscores
  for select to anon using (true);
```

> **Important:** because RLS is on by default, the table will reject all
> anon reads and inserts until both policies above exist. If the scoreboard
> shows no scores or submissions silently fail, confirm the two policies are
> present on `spacegame_highscores`.

## 3. Get your credentials

In the Supabase dashboard go to **Project Settings → API**.

| Value | Where to find it |
|-------|-----------------|
| `SUPABASE_URL` | **Project URL** (e.g. `https://xyzxyz.supabase.co`) |
| `SUPABASE_ANON_KEY` | **anon / public** key under *Project API keys* |

The anon key is safe to expose — the row-level security policies above restrict what it can do.

## 4. Add secrets to GitHub

1. In your GitHub repo go to **Settings → Secrets and variables → Actions**.
2. Click **New repository secret** and add:
   - Name: `SUPABASE_URL` — Value: your Project URL
   - Name: `SUPABASE_ANON_KEY` — Value: your anon key
3. Push any commit to `main`. The deploy workflow will inject the credentials into `src/config.js` before uploading to GitHub Pages.

## 5. Verify

After the deploy finishes, open the live site, play a game, and submit a score. Then check **Table Editor → spacegame_highscores** in Supabase to confirm the row arrived with a `version` value.

## Schema migrations

When the table schema changes, run the migration SQL in the **SQL Editor** and update this file in the same change.

| Version | Migration |
|---------|-----------|
| v4.9 | `ALTER TABLE highscores ADD COLUMN version TEXT;` — records the game version string with each score so the scoreboard can filter by version. |
| v6.7 | Tables restructured to the `spacegame_` prefix. Rename the existing table: `ALTER TABLE highscores RENAME TO spacegame_highscores;` (existing policies follow the table automatically). For a fresh project, create it with the prefixed name per section 2 above. RLS is now enabled by default on all tables — the `insert scores` / `read scores` policies remain required for anon access. |
