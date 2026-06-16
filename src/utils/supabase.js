import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';

const TABLE = 'highscores';

function ready() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function apiHeaders() {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function submitScore(name, score, highestLevel) {
  if (!ready()) return;
  await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: { ...apiHeaders(), 'Prefer': 'return=minimal' },
    body: JSON.stringify({ name, score, highest_level: highestLevel }),
  });
}

export async function fetchTopScores(limit = 10) {
  if (!ready()) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?select=name,score,highest_level&order=score.desc&limit=${limit}`,
      { headers: apiHeaders() },
    );
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}
