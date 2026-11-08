import { el } from '../dom.js';

// English number formatting everywhere in the app: 31450 -> "31,450".
const numberFormat = new Intl.NumberFormat('en-GB');

// Draws the four overview numbers into the green band.
export function renderStats(root, stats) {
  const tiles = [
    [stats.totalWorkouts, stats.totalWorkouts === 1 ? 'workout' : 'workouts'],
    [stats.workoutsLast30Days, 'in the last 30 days'],
    [stats.totalSets, 'sets'],
    [stats.totalVolumeKg, 'kg lifted'],
  ];

  root.replaceChildren(
    ...tiles.map(([value, label]) =>
      el('div', { class: 'stat' },
        el('span', { class: 'stat-value' }, numberFormat.format(value)),
        el('span', { class: 'stat-label' }, label),
      ),
    ),
  );
}

// Draws one card per personal record. The whole section stays hidden
// until the user has at least one record.
export function renderRecords(section, list, records) {
  section.hidden = records.length === 0;

  list.replaceChildren(
    ...records.map((record) =>
      el('li', { class: 'record' },
        el('span', { class: 'record-exercise' }, record.exercise),
        el('strong', { class: 'record-value' }, formatRecord(record)),
        el('span', { class: 'record-date' }, formatShortDate(record.date)),
      ),
    ),
  );
}

// A record's value in the unit that fits it: "90 kg", "1:30" or "25 reps".
function formatRecord({ kind, value }) {
  if (kind === 'weight') return `${numberFormat.format(value)} kg`;
  if (kind === 'time') return formatDuration(value);
  return `${value} reps`;
}

// 45 -> "45 s", 90 -> "1:30" (minutes:seconds).
function formatDuration(totalSeconds) {
  if (totalSeconds < 60) return `${totalSeconds} s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// "2026-11-04" -> "4 Nov", read as a local calendar date (not UTC midnight).
function formatShortDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
