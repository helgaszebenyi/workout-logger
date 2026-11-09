// Small DOM and formatting helpers shared by the views.
//
// User data is always inserted as text (never as HTML), so a workout titled
// "<script>..." is shown literally instead of being run. This prevents
// cross-site scripting (XSS).

// Creates an element with attributes and children.
// Example: el('p', { class: 'muted' }, 'Hello')
// Falsy children (null, false, '') are skipped, which makes optional parts easy.
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false || child === '') continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
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