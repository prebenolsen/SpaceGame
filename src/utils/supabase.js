import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';
import { VERSION } from '../version.js';

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
    body: JSON.stringify({ name, score, highest_level: highestLevel, version: VERSION }),
  });
}

export async function fetchVersions() {
  if (!ready()) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${TABLE}?select=version&limit=1000`,
      { headers: apiHeaders() },
    );
    if (!res.ok) return [];
    const rows = await res.json();
    const seen = new Set();
    for (const row of rows) {
      if (row.version) seen.add(row.version);
    }
    return [...seen].sort((a, b) => {
      const parse = v => v.split('.').map(Number);
      const [ma, pa = 0] = parse(a);
      const [mb, pb = 0] = parse(b);
      return (mb - ma) || (pb - pa);
    });
  } catch {
    return [];
  }
}

export async function fetchTopScores(limit = 10, version = null) {
  if (!ready()) return [];
  try {
    let url = `${SUPABASE_URL}/rest/v1/${TABLE}?select=name,score,highest_level&order=score.desc&limit=${limit}`;
    if (version !== null) {
      url += `&version=eq.${encodeURIComponent(version)}`;
    }
    const res = await fetch(url, { headers: apiHeaders() });
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}
