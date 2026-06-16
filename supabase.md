# Supabase Setup

## 1. Create a project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**, give it a name (e.g. `spacegame`), choose a region, set a database password, and click **Create new project**.
3. Wait for the project to finish provisioning (~1 minute).

## 2. Create the highscores table

Open the **SQL Editor** (left sidebar) and run:

```sql
create table highscores (
  id         bigint generated always as identity primary key,
  name       text        not null,
  score      bigint      not null,
  highest_level integer  not null,
  created_at timestamptz not null default now()
);

-- Anyone can insert and read scores; no one can update or delete.
alter table highscores enable row level security;

create policy "insert scores" on highscores
  for insert to anon with check (true);

create policy "read scores" on highscores
  for select to anon using (true);
```

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

After the deploy finishes, open the live site, play a game, and submit a score. Then check **Table Editor → highscores** in Supabase to confirm the row arrived.
