// Formatting helpers shared by the components.
// Dates and numbers are always shown in English, whatever the computer's language.
const LOCALE = 'en-GB';
const numberFormat = new Intl.NumberFormat(LOCALE);

// 31450 -> "31,450"
export function formatNumber(value) {
  return numberFormat.format(value);
}

// "3 sets", "1 set": the word gets an "s" unless the count is exactly 1.
export function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// Seconds as a readable time: 45 -> "45 s", 80 -> "1:20", 10000 -> "2:46:40".
export function formatDuration(totalSeconds) {
  if (totalSeconds < 60) return `${totalSeconds} s`;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`;
}

// Builds a Date from "YYYY-MM-DD" as a local calendar date (not UTC midnight).
export function parseDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Date in any style, e.g. formatDate('2026-11-04', { day: 'numeric', month: 'short' }) -> "4 Nov"
export function formatDate(isoDate, options) {
  return parseDate(isoDate).toLocaleDateString(LOCALE, options);
}

// "2026-11" -> "November 2026"
export function formatMonth(yearMonth) {
  return formatDate(`${yearMonth}-01`, { month: 'long', year: 'numeric' });
}

// How one set reads: "5 reps @ 80 kg", "1:20" (plank) or "1 rep".
function describeSet(set) {
  const amount = set.durationSec ? formatDuration(set.durationSec) : plural(set.reps, 'rep');
  return set.weightKg ? `${amount} @ ${set.weightKg} kg` : amount;
}

// Groups identical sets in a row, one text per group:
// [5@80, 5@80, 3@90] -> ["2 × 5 reps @ 80 kg", "3 reps @ 90 kg"]
export function groupSets(sets) {
  const groups = [];
  for (const set of sets) {
    const text = describeSet(set);
    const last = groups.at(-1);
    if (last && last.text === text) last.count += 1;
    else groups.push({ text, count: 1 });
  }
  return groups.map(({ text, count }) => (count > 1 ? `${count} × ${text}` : text));
}

// A personal record in the unit that fits it: "90 kg", "1:30" or "25 reps".
export function formatRecord({ kind, value }) {
  if (kind === 'weight') return `${formatNumber(value)} kg`;
  if (kind === 'time') return formatDuration(value);
  return plural(value, 'rep');
}
