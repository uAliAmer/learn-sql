// A simple day-streak: how many consecutive days the learner has completed
// at least one lesson. Stored in localStorage.
const KEY = "learn-sql:streak:v1";

interface StreakData {
  last: string; // YYYY-MM-DD of last activity
  count: number;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const ms = Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

function read(): StreakData | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StreakData) : null;
  } catch {
    return null;
  }
}

/** Current streak — alive if the last activity was today or yesterday, else 0. */
export function currentStreak(): number {
  const d = read();
  if (!d?.last) return 0;
  const gap = daysBetween(d.last, today());
  return gap === 0 || gap === 1 ? d.count : 0;
}

/** Record activity for today; returns the new streak count. */
export function bumpStreak(): number {
  const t = today();
  const d = read();
  let count = 1;
  if (d?.last === t) count = d.count; // already counted today
  else if (d?.last && daysBetween(d.last, t) === 1) count = d.count + 1; // consecutive day
  try {
    localStorage.setItem(KEY, JSON.stringify({ last: t, count }));
  } catch {
    /* best-effort */
  }
  return count;
}
