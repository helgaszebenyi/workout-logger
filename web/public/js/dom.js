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

// "2026-11-03" -> "Tue, 3 Nov 2026" in the user's language settings
export function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  // Built from parts so it's read as a local calendar date, not UTC midnight.
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}