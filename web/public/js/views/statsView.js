import { el, formatDuration, parseDate } from '../dom.js';

// English number formatting everywhere in the app: 31450 -> "31,450".
const numberFormat = new Intl.NumberFormat('en-GB');

// Draws the four overview numbers into the top box.
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

// Draws one row per personal record. The whole box stays hidden
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
  return `${value} ${value === 1 ? 'rep' : 'reps'}`;
}

// "2026-11-04" -> "4 Nov"
function formatShortDate(isoDate) {
  return parseDate(isoDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
